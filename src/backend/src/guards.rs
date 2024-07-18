use crate::read_config;
use candid::Principal;
use ic_cdk::caller;

pub fn caller_is_not_anonymous() -> Result<(), String> {
    if caller() == Principal::anonymous() {
        Err("Anonymous caller not authorized.".to_string())
    } else {
        Ok(())
    }
}

pub fn caller_is_allowed() -> Result<(), String> {
    if read_config(|s| s.allowed_callers.contains(&caller())) {
        Ok(())
    } else {
        Err("Caller is not allowed.".to_string())
    }
}

/// User data writes are locked during and after a migration away to another canister.
pub fn may_write_user_data() -> Result<(), String> {
    caller_is_not_anonymous()?;
    if read_config(|s| s.api.unwrap_or_default().user_data.writable()) {
        Err("User data is in read only mode due to a migration.".to_string())
    } else {
        Ok(())
    }
}

/// User data writes are locked during and after a migration away to another canister.
pub fn may_read_user_data() -> Result<(), String> {
    caller_is_not_anonymous()?;
    if read_config(|s| s.api.unwrap_or_default().user_data.readable()) {
        Err("User data cannot be read at this time due to a migration.".to_string())
    } else {
        Ok(())
    }
}

/// Is getting threshold public keys is enabled?
pub fn may_read_threshold_keys() -> Result<(), String> {
    caller_is_not_anonymous()?;
    if read_config(|s| s.api.unwrap_or_default().threshold_key.readable()) {
        Err("Reading threshold keys is disabled.".to_string())
    } else {
        Ok(())
    }
}

/// Is signing with threshold keys is enabled?
pub fn may_threshold_sign() -> Result<(), String> {
    caller_is_not_anonymous()?;
    if read_config(|s| s.api.unwrap_or_default().threshold_key.writable()) {
        Err("Threshold signing is disabled.".to_string())
    } else {
        Ok(())
    }
}
