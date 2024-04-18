use shared::types::custom_token::CustomToken;
use shared::types::token::UserToken;
use shared::types::TokenTimestamp;

pub fn assert_tokens_eq(results_tokens: &[UserToken], expected_tokens: &[UserToken]) {
    assert_eq!(results_tokens.len(), expected_tokens.len());

    for (token, expected) in results_tokens.iter().zip(expected_tokens.iter()) {
        assert_eq!(token.contract_address, expected.contract_address);
        assert_eq!(token.chain_id, expected.chain_id);
        assert_eq!(token.symbol, expected.symbol);
        assert_eq!(token.decimals, expected.decimals);
    }
}

pub fn assert_custom_tokens_eq(
    results_tokens: Vec<CustomToken>,
    expected_tokens: Vec<CustomToken>,
) {
    assert_eq!(results_tokens.len(), expected_tokens.len());

    for (token, expected) in results_tokens.iter().zip(expected_tokens.iter()) {
        assert!(expected.token == token.token);
        assert_eq!(expected.enabled, token.enabled);
    }
}

pub fn assert_some_tokens_timestamp<T>(tokens: &[T])
where
    T: TokenTimestamp,
{
    for token in tokens.iter() {
        assert!(token.get_timestamp().is_some(), "Token has no timestamp: {}", token);
    }
}

pub fn assert_none_tokens_timestamp<T>(tokens: Vec<T>)
where
    T: TokenTimestamp,
{
    for token in tokens.iter() {
        assert!(token.get_timestamp().is_none(), "Token has no timestamp: {}", token);
    }
}
