use std::cell::RefCell;
use std::collections::HashSet;

/// Airdrop backend canister
/// This canister is responsible for generating codes and redeeming them.
/// It also stores the mapping between II and Ethereum address.
///
/// We add a type for everything as it is easier to reason with
/// TODO:
/// - add logging
/// - should we not allow the same eth wallet to get added multiple time? For bot preventation
use candid::{types::principal::Principal, CandidType};
use ic_cdk::storage::{stable_restore, stable_save};
use ic_cdk::{caller, trap};
use ic_cdk_macros::{export_candid, init, post_upgrade, pre_upgrade, query, update};
use serde::{Deserialize, Serialize};
use state::{AirdropAmount, Arg, Code, CodeInfo, Info, InitArg, PrincipalState, EthAddressAmount, Index};

mod guards;
mod state;
mod utils;
use crate::guards::{caller_is_admin, caller_is_manager};
use crate::state::{CodeState, State};
use crate::utils::get_eth_address;
use crate::utils::{
    add_user_to_airdrop_reward, check_if_killed, deduct_tokens, get_pre_codes,
    register_principal_with_eth_address,
};

type CustomResult<T> = Result<T, CanisterError>;

static TOKEN_PER_PERSON: u64 = 400;
static MAXIMUM_DEPTH: u64 = 2;
static NUMBERS_OF_CHILDREN: u64 = 3;
// TODO set during init
static INITIAL_TOKENS: u64 = 100_000;

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::default();
}

pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(cell.borrow().as_ref().expect("state not initialized")))
}

pub fn mutate_state<F, R>(f: F) -> R
where
    F: FnOnce(&mut State) -> R,
{
    STATE.with(|s| f(s.borrow_mut().as_mut().expect("state is not initialized")))
}

#[derive(Serialize, Deserialize, Clone, Debug, CandidType)]
pub enum CanisterError {
    GeneralError(String),
    CanisterKilled,
    CodeNotFound,
    CodeAlreadyRedeemed,
    CannotRegisterMultipleTimes,
    NoChildrenForCode,
    NoCodeForII,
    MaximumDepthReached,
    NoMoreCodes,
    UnknownOisyWalletAddress,
}

#[init]
fn init(arg: Arg) {
    match arg {
        Arg::Init(InitArg {
            backend_canister_id,
        }) => STATE.with(|cell| {
            *cell.borrow_mut() = Some(State {
                backend_canister_id,
                principals_admin: HashSet::from([caller()]),
                ..State::default()
            })
        }),
        Arg::Upgrade => trap("upgrade args in init"),
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    read_state(|s| stable_save((s,))).expect("failed to encode the state");
}

#[post_upgrade]
fn post_upgrade() {
    STATE.with(|cell| {
        let (s,) = stable_restore().expect("failed to decode state");
        *cell.borrow_mut() = s;
    });
}

/// Add codes generated offline
#[update(guard = "caller_is_admin")]
pub fn add_codes(codes: Vec<String>) -> CustomResult<()> {
    // generate non activated codes
    mutate_state(|state| {
        for code in codes {
            let code = Code(code);
            state.pre_generated_codes.push(code.clone());
        }
        Ok(())
    })
}

#[update(guard = "caller_is_admin")]
pub fn add_admin(principal: Principal) -> CustomResult<()> {
    mutate_state(|state| {
        state.principals_admin.insert(principal);

        Ok(())
    })
}

/// Add a given principal to the list of authorised principals - i.e. the list of principals that can generate codes
#[update(guard = "caller_is_admin")]
pub fn add_manager(principal: Principal, name: String) -> CustomResult<()> {
    mutate_state(|state| {
        let principal_state = PrincipalState {
            name,
            codes_generated: 0,
            codes_redeemed: 0,
        };
        state.principals_managers.insert(principal, principal_state);

        Ok(())
    })
}

/// check whether a given principal is authorised to generate codes
#[query]
pub fn is_manager() -> bool {
    let caller_principal = caller();

    read_state(|state| state.principals_managers.contains_key(&caller_principal))
}

/// Returns one code if the given principal is authorized to generate codes
#[update(guard = "caller_is_manager")]
pub fn generate_code() -> CustomResult<CodeInfo> {
    check_if_killed()?;

    let caller_principal = caller();

    mutate_state(|state| {
        // generate a new code
        let code = utils::get_pre_codes()?;

        // insert the newly fetched code
        state
            .codes
            .insert(code.clone(), CodeState::new(caller_principal, 0, false));

        // the caller_is_manager guard makes it safe to unwrap
        let principal_state = state
            .principals_managers
            .get_mut(&caller_principal)
            .unwrap();

        principal_state.codes_generated += 1;

        Ok(CodeInfo::new(
            code,
            principal_state.codes_generated,
            principal_state.codes_redeemed,
        ))
    })
}

/// Function to be called when the user has a code
/// The code the user wants to redeem
/// The ETH address of the user
/// TODO: to be reviewed
#[update]
pub async fn redeem_code(code: Code) -> CustomResult<Info> {
    check_if_killed()?;

    let caller_principal = caller();
    let eth_address = get_eth_address().await?;

    mutate_state(|state| {
        // Check if the given principal has redeemed any code yet
        if state.principals_user_eth.contains_key(&caller_principal) {
            return Err(CanisterError::CannotRegisterMultipleTimes);
        }

        // Check if code exists
        if !state.codes.contains_key(&code) {
            return Err(CanisterError::CodeNotFound);
        }

        // Check if code is already redeemed - unwrap is safe as we have checked the code exists
        if state.codes.get(&code).unwrap().redeemed {
            return Err(CanisterError::CodeAlreadyRedeemed);
        }

        // Deduct the expected full amount redeemable by the user
        if state.codes.get(&code).unwrap().depth < MAXIMUM_DEPTH {
            deduct_tokens(TOKEN_PER_PERSON)?;
        } else {
            // We will redeem 1/4 of the amount as if the code depth == MAXIMUM_DEPTH
            deduct_tokens(TOKEN_PER_PERSON / 4)?;
        }

        let parent_principal = state.codes.get(&code).unwrap().parent_principal;

        // if code parent is one of the managers we increment the number of redeemed codes
        if state.principals_managers.contains_key(&parent_principal) {
            state
                .principals_managers
                .get_mut(&parent_principal)
                .unwrap()
                .codes_redeemed += 1;
        } else {
            // TODO in this current configuration managers do not get the airdrop
            // add parent eth address to the list of eth addresses to send tokens to
            if let Some((_, parent_eth_address)) = state.principals_user_eth.get(&parent_principal)
            {
                add_user_to_airdrop_reward(
                    parent_eth_address.clone(),
                    AirdropAmount(TOKEN_PER_PERSON / 4),
                )
            }
        }

        // Link code with principal and Ethereum address
        register_principal_with_eth_address(caller_principal, code.clone(), eth_address.clone());

        // Mark code as redeemed
        state.codes.get_mut(&code).unwrap().redeemed = true;

        // add user to the airdrop
        add_user_to_airdrop_reward(eth_address.clone(), AirdropAmount(TOKEN_PER_PERSON / 4));

        let depth = state.codes.get(&code).unwrap().depth;

        // Generate children codes only if we are below the maximum depth
        let children_codes = if state.codes.get(&code).unwrap().depth < MAXIMUM_DEPTH {
            let children_code: Vec<Code> = (0..NUMBERS_OF_CHILDREN)
                // TODO proper error returned
                .map(|_x| get_pre_codes().unwrap())
                .collect();
            let mut children = Vec::default();

            for child_code in children_code {
                children.push((child_code.clone(), false));

                // Associate child code with parent principal/depth/redeemed
                state.codes.insert(
                    child_code.clone(),
                    CodeState::new(caller_principal, depth + 1, false),
                );
            }

            // children code and whether they have been redeemed
            Some(children)
        } else {
            None
        };

        // return Info
        Ok(Info::new(
            code.clone(),
            caller_principal,
            eth_address,
            children_codes,
        ))
    })
}

/// Return all the information about a given Principal's code
#[query]
pub fn get_code() -> CustomResult<Info> {
    check_if_killed()?;
    let caller_principal = caller();

    read_state(|state| {
        // get the code and eth_address associated with the principal
        let (code, eth_address) = state
            .principals_user_eth
            .get(&caller_principal)
            .cloned()
            .ok_or(CanisterError::CodeNotFound)?;

        // get the children associated with a given principal
        let children: Vec<(Code, bool)> = state
            .codes
            .iter()
            .filter(|(_, code_state)| code_state.parent_principal == caller_principal)
            .map(|(code, code_state)| {
                let redeemed = code_state.redeemed;
                (code.clone(), redeemed)
            })
            .collect();

        let children = if children.is_empty() {
            None
        } else {
            Some(children)
        };

        Ok(Info::new(code, caller_principal, eth_address, children))
    })
}

#[update(guard = "caller_is_admin")]
fn kill_canister() -> CustomResult<()> {
    mutate_state(|state| {
        state.killed = true;
    });

    Ok(())
}

#[update(guard = "caller_is_admin")]
fn bring_caninster_back_to_life() -> CustomResult<()> {
    mutate_state(|state| {
        state.killed = false;
    });

    Ok(())
}


/// Returns all the eth addresses with how much is meant to be sent to each one of them
#[update(guard = "caller_is_admin")]
pub fn get_airdrop(mut index: Index) -> CustomResult<(Index, Vec<EthAddressAmount>)> {
    check_if_killed()?;

    read_state(|state| {
        let mut airdrop = Vec::default();

        // TODO: dangerous casting from u64 to usize?
        for idx in (index.0 as usize)..state.airdrop_reward.len() {
            if !state.airdrop_reward[idx].transferred {
                airdrop.push(state.airdrop_reward[idx].clone());
                index = Index(idx as u64);
            }
        }

        Ok((index, airdrop))
    })
}

/// Pushes the new state of who was transferred money
#[update(guard = "caller_is_admin")]
pub fn put_airdrop(index: Index, eth_address_amount: EthAddressAmount) -> CustomResult<()> {
    check_if_killed()?;

    mutate_state(|state| {
        // for the index to the end of the list update the state
        for i in index.0..state.airdrop_reward.len() as u64 {
            if state.airdrop_reward[i as usize].eth_address == eth_address_amount.eth_address {
                state.airdrop_reward[i as usize].transferred = true;
            }
        }

    });

    Ok(())
}


/// For a given principal check if the original airdrop amount has been redeemed
#[query]
pub fn has_redeemed() -> CustomResult<bool> {
    check_if_killed()?;

    let caller_principal = caller();

    read_state(|state| {
        // get the code and eth_address associated with the principal
        let (_, eth_address) = state
            .principals_user_eth
            .get(&caller_principal)
            .cloned()
            .ok_or(CanisterError::CodeNotFound)?;

        // check if the eth address has been redeemed
        let has_redeemed = state
            .airdrop_reward
            .iter()
            .any(|eth_address_amount| eth_address_amount.eth_address == eth_address);

        Ok(has_redeemed)
    })
}

// automatically generates the candid file
export_candid!();
