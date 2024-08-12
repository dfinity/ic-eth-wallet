//! End to end tests for migration.

use std::sync::Arc;

use crate::utils::pocketic::{controller, setup, BackendBuilder, PicBackend, PicCanisterTrait};
use pocket_ic::PocketIc;
use shared::types::{user_profile::Stats, ApiEnabled, Guards, MigrationReport};

struct MigrationTestEnv {
    /// Simulated Internet Computer
    pic: Arc<PocketIc>,
    /// The old backend canister ID, from which data is being migrated.
    old_backend: PicBackend,
    /// The new backend canister ID.
    new_backend: PicBackend,
}

impl Default for MigrationTestEnv {
    fn default() -> Self {
        let mut pic = Arc::new(PocketIc::new());
        let old_backend = PicBackend {
            pic: pic.clone(),
            canister_id: BackendBuilder::default().deploy_to(&mut pic),
        };
        let new_controllers = [
            BackendBuilder::default_controllers(),
            vec![old_backend.canister_id()],
        ]
        .concat();
        let new_backend = PicBackend {
            pic: pic.clone(),
            canister_id: BackendBuilder::default()
                .with_controllers(new_controllers)
                .deploy_to(&mut pic),
        };
        MigrationTestEnv {
            pic,
            old_backend,
            new_backend,
        }
    }
}

#[test]
fn test_by_default_no_migration_is_in_progress() {
    let pic_setup = setup();

    let get_migration_response =
        pic_setup.query::<Option<MigrationReport>>(controller(), "migration", ());

    assert_eq!(
        get_migration_response,
        Ok(None),
        "By default, no migration should be in progress"
    );
}

#[test]
fn test_empty_migration() {
    let pic_setup = MigrationTestEnv::default();
    let user_range = 1..5;
    pic_setup.old_backend.create_users(user_range.clone());

    // Initially no migrations should be in progress.
    assert_eq!(
        pic_setup
            .old_backend
            .query::<Option<MigrationReport>>(controller(), "migration", ()),
        Ok(None),
        "Initially, no migration should be in progress"
    );
    assert_eq!(
        pic_setup
            .new_backend
            .query::<Option<MigrationReport>>(controller(), "migration", ()),
        Ok(None),
        "Initially, no migration should be in progress"
    );
    // There should be users in the old backend.
    assert_eq!(
        pic_setup
            .old_backend
            .query::<Stats>(controller(), "stats", ()),
        Ok(Stats {
            user_profile_count: user_range.len() as u64,
            user_timestamps_count: user_range.len() as u64,
            custom_token_count: 0,
            user_token_count: 0,
        }),
        "Initially, there should be users in the old backend"
    );
    // There should be no users in the new backend.
    assert_eq!(
        pic_setup
            .new_backend
            .query::<Stats>(controller(), "stats", ()),
        Ok(Stats {
            user_profile_count: 0,
            user_timestamps_count: 0,
            custom_token_count: 0,
            user_token_count: 0,
        }),
        "Initially, there should be no users in the new backend"
    );
    // Start migration
    {
        assert_eq!(
            pic_setup
                .old_backend
                .update::<Result<MigrationReport, String>>(
                    controller(),
                    "migrate_user_data_to",
                    pic_setup.new_backend.canister_id()
                )
                .expect("Failed to start migration"),
            Ok(MigrationReport {
                to: pic_setup.new_backend.canister_id(),
                progress: shared::types::MigrationProgress::Pending
            }),
        );
        // Migration should be in progress.
        assert_eq!(
            pic_setup
                .old_backend
                .query::<Option<MigrationReport>>(controller(), "migration", ()),
            Ok(Some(MigrationReport {
                to: pic_setup.new_backend.canister_id(),
                progress: shared::types::MigrationProgress::Pending,
            })),
            "Migration should be in progress"
        );
    }
    // Step the timer: User data writing should be locked.
    {
        pic_setup.pic.tick();
        assert_eq!(
            pic_setup
                .old_backend
                .query::<Option<MigrationReport>>(controller(), "migration", ()),
            Ok(Some(MigrationReport {
                to: pic_setup.new_backend.canister_id(),
                progress: shared::types::MigrationProgress::Locked,
            })),
            "Migration should be in progress"
        );
        let old_config = pic_setup
            .old_backend
            .query::<shared::types::Config>(controller(), "config", ())
            .expect("Failed to get config");
        assert_eq!(
            old_config.api,
            Some(Guards {
                threshold_key: ApiEnabled::ReadOnly,
                user_data: ApiEnabled::ReadOnly
            }),
            "Local user data writes should be locked."
        );
    }
    // Step the timer: Target canister should be locked.
    {
        pic_setup.pic.tick();
        assert_eq!(
            pic_setup
                .old_backend
                .query::<Option<MigrationReport>>(controller(), "migration", ()),
            Ok(Some(MigrationReport {
                to: pic_setup.new_backend.canister_id(),
                progress: shared::types::MigrationProgress::TargetLocked,
            })),
            "Migration should be in progress"
        );
        // Check that the target really is locked:
        let new_config = pic_setup
            .new_backend
            .query::<shared::types::Config>(controller(), "config", ())
            .expect("Failed to get config");
        assert_eq!(
            new_config.api,
            Some(Guards {
                threshold_key: ApiEnabled::ReadOnly,
                user_data: ApiEnabled::ReadOnly
            }),
            "Target canister user data writes should be locked."
        );
    }
    // Step the timer: Should have found the target canister to be empty.
    {
        pic_setup.pic.tick();
        assert_eq!(
            pic_setup
                .old_backend
                .query::<Option<MigrationReport>>(controller(), "migration", ()),
            Ok(Some(MigrationReport {
                to: pic_setup.new_backend.canister_id(),
                progress: shared::types::MigrationProgress::TargetPreCheckOk,
            })),
            "Migration should be in progress"
        );
    }
    // Step the timer: Should have started the user token migration.
    {
        pic_setup.pic.tick();
        assert_eq!(
            pic_setup
                .old_backend
                .query::<Option<MigrationReport>>(controller(), "migration", ()),
            Ok(Some(MigrationReport {
                to: pic_setup.new_backend.canister_id(),
                progress: shared::types::MigrationProgress::MigratedUserTokensUpTo(None),
            })),
            "Migration should be in progress"
        );
    }
    // Keep stepping until the user tokens have been migrated.
    {
        while let Some(MigrationReport {
            progress: shared::types::MigrationProgress::MigratedUserTokensUpTo(_),
            ..
        }) = pic_setup
            .old_backend
            .query::<Option<MigrationReport>>(controller(), "migration", ())
            .expect("Failed to get migration report")
        {
            pic_setup.pic.tick();
        }
    }
}
