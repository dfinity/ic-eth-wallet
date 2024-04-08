use crate::types::token::{IcrcToken, UserToken, UserTokenId};

impl PartialEq for UserToken {
    fn eq(&self, other: &Self) -> bool {
        let self_id = UserTokenId::from(self.clone());
        let other_id = UserTokenId::from(other.clone());

        self_id == other_id
    }
}

impl From<UserToken> for UserTokenId {
    fn from(token: UserToken) -> Self {
        match token {
            UserToken::Icrc(token) => UserTokenId::Icrc(token.ledger_id),
        }
    }
}

impl PartialEq for UserTokenId {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (UserTokenId::Icrc(self_ledger_id), UserTokenId::Icrc(other_ledger_id)) => {
                self_ledger_id == other_ledger_id
            }
        }
    }
}

impl PartialEq for IcrcToken {
    fn eq(&self, other: &Self) -> bool {
        self.ledger_id == other.ledger_id
    }
}