use crate::utils::mock::CALLER;
use candid::{decode_one, encode_one, CandidType, Principal};
use pocket_ic::{CallError, PocketIc, WasmResult};
use serde::Deserialize;
use shared::types::{Arg, CredentialType, InitArg, SupportedCredential};
use std::env;
use std::fs::read;

use super::mock::{CONTROLLER, II_CANISTER_ID, II_ORIGIN, ISSUER_CANISTER_ID, ISSUER_ORIGIN};

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/backend.wasm";

// Oisy's backend require an ecdsa_key_name for initialization.
// PocketIC does not get mounted with "key_1" or "test_key_1" available in the management canister. If the canister request those ecdsa_public_key, it throws an error.
// Instead, we can use the master_ecdsa_public_key suffixed with the subnet ID. PocketID adds the suffix because it can have multiple subnets.
const SUBNET_ID: &str = "fscpm-uiaaa-aaaaa-aaaap-yai";

#[inline]
pub fn controller() -> Principal {
    Principal::from_text(CONTROLLER)
        .expect("Test setup error: Failed to parse controller principal")
}

pub fn setup() -> (PocketIc, Principal) {
    let backend_wasm_path =
        env::var("BACKEND_WASM_PATH").unwrap_or_else(|_| BACKEND_WASM.to_string());

    setup_with_custom_wasm(&backend_wasm_path, None)
}

pub fn setup_with_custom_wasm(
    wasm_path: &str,
    encoded_arg: Option<Vec<u8>>,
) -> (PocketIc, Principal) {
    let (pic, canister_id) = init();

    let wasm_bytes = read(wasm_path).expect(&format!("Could not find the wasm: {}", wasm_path));

    let arg = encoded_arg.unwrap_or(encode_one(&init_arg()).unwrap());

    pic.install_canister(canister_id, wasm_bytes, arg, None);

    pic.set_controllers(canister_id.clone(), None, vec![controller()])
        .expect("Test setup error: Failed to set controllers");

    (pic, canister_id)
}

pub fn upgrade_latest_wasm(
    pocket_ic: &(PocketIc, Principal),
    encoded_arg: Option<Vec<u8>>,
) -> Result<(), String> {
    let backend_wasm_path =
        env::var("BACKEND_WASM_PATH").unwrap_or_else(|_| BACKEND_WASM.to_string());

    upgrade_with_wasm(pocket_ic, &backend_wasm_path, encoded_arg)
}

pub fn upgrade_with_wasm(
    (pic, canister_id): &(PocketIc, Principal),
    backend_wasm_path: &String,
    encoded_arg: Option<Vec<u8>>,
) -> Result<(), String> {
    let wasm_bytes = read(backend_wasm_path.clone()).expect(&format!(
        "Could not find the backend wasm: {}",
        backend_wasm_path
    ));

    let arg = encoded_arg.unwrap_or(encode_one(&init_arg()).unwrap());

    pic.upgrade_canister(
        canister_id.clone(),
        wasm_bytes,
        encode_one(&arg).unwrap(),
        Some(controller()),
    )
    .map_err(|e| match e {
        CallError::Reject(e) => e,
        CallError::UserError(e) => {
            format!(
                "Upgrade canister error. RejectionCode: {:?}, Error: {}",
                e.code, e.description
            )
        }
    })
}

fn init() -> (PocketIc, Principal) {
    let pic = PocketIc::new();
    let canister_id =
        pic.create_canister_on_subnet(None, None, Principal::from_text(SUBNET_ID).unwrap());
    pic.add_cycles(canister_id, 2_000_000_000_000);

    (pic, canister_id)
}

pub(crate) fn init_arg() -> Arg {
    Arg::Init(InitArg {
        ecdsa_key_name: format!("master_ecdsa_public_key_{}", SUBNET_ID).to_string(),
        allowed_callers: vec![Principal::from_text(CALLER).unwrap()],
        ic_root_key_der: None,
        supported_credentials: Some(vec![SupportedCredential {
            ii_canister_id: Principal::from_text(II_CANISTER_ID.to_string())
                .expect("wrong ii canister id"),
            ii_origin: II_ORIGIN.to_string(),
            issuer_canister_id: Principal::from_text(ISSUER_CANISTER_ID.to_string())
                .expect("wrong issuer canister id"),
            issuer_origin: ISSUER_ORIGIN.to_string(),
            credential_type: CredentialType::ProofOfUniqueness,
        }]),
    })
}

pub fn update_call<T>(
    (pic, canister_id): &(PocketIc, Principal),
    caller: Principal,
    method: &str,
    arg: impl CandidType,
) -> Result<T, String>
where
    T: for<'a> Deserialize<'a> + CandidType,
{
    pic.update_call(
        canister_id.clone(),
        caller,
        method,
        encode_one(arg).unwrap(),
    )
    .map_err(|e| {
        format!(
            "Update call error. RejectionCode: {:?}, Error: {}",
            e.code, e.description
        )
    })
    .and_then(|reply| match reply {
        WasmResult::Reply(reply) => decode_one(&reply).map_err(|_| "Decoding failed".to_string()),
        WasmResult::Reject(error) => Err(error),
    })
}

pub fn query_call<T>(
    (pic, canister_id): &(PocketIc, Principal),
    caller: Principal,
    method: &str,
    arg: impl CandidType,
) -> Result<T, String>
where
    T: for<'a> Deserialize<'a> + CandidType,
{
    pic.query_call(
        canister_id.clone(),
        caller,
        method,
        encode_one(arg).unwrap(),
    )
    .map_err(|e| {
        format!(
            "Query call error. RejectionCode: {:?}, Error: {}",
            e.code, e.description
        )
    })
    .and_then(|reply| match reply {
        WasmResult::Reply(reply) => decode_one(&reply).map_err(|_| "Decoding failed".to_string()),
        WasmResult::Reject(error) => Err(error),
    })
}
