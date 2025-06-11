import {
    collection,
    doc,
    onSnapshot,
    serverTimestamp,
    getDocs,
    query,
    where,
    deleteField,
    runTransaction,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

export const useUserGearsStore = defineStore('userGearsStore', () => {
    const db = firebaseUtils.getFirestoreDB();
    const userStore = useUserStore();
    const { user } = storeToRefs(userStore);
    const gearCollectionRef = collection(db, 'gear');
    const gearMap = ref<UserGears>({}); // gearMap is the local state that holds all user's gears
    const gears = computed(() => Object.values(gearMap.value));
    const visibleGears = computed(() =>
        gears.value.filter((gear) => !gear.isForOneTrip && !gear.isArchived),
    );
    const archivedGears = computed(() =>
        gears.value.filter((gear) => gear.isArchived),
    );
    const isFirstFetching = ref(true);
    const unsubscribe = ref<null | (() => void)>(null);
    const isInitialized = ref(false);

    const getGearById = computed(() => (id: string) => gearMap.value[id]);

    const buildNewGear = (userId: string, gearData: EditingGear) => {
        const newGear: any = {
            ...constants.EMPTY_GEAR_DATA,
            ...gearData,
            role: {
                [userId]: constants.ROLES.OWNER,
            },
            created: serverTimestamp(),
        };

        // delete undefined fields from newGear
        Object.entries(newGear).forEach(([key, value]) => {
            if (value === undefined) {
                delete newGear[key];
            }
        });

        return newGear;
    };

    const formatDataToGearType = (
        id: string,
        gearData?: Partial<Gear> | DocumentData,
    ): Gear => {
        const gear: any = {
            ...constants.EMPTY_GEAR_DATA,
            ...gearData,
            id,
        };

        // delete undefined fields from gear
        Object.entries(gear).forEach(([key, value]) => {
            if (value === undefined) {
                delete gear[key];
            }
        });

        return gear as Gear;
    };

    const initialize = async () => {
        if (isInitialized.value || !user.value) {
            console.error('initialize useUserGearsStore fail');
            return;
        }

        // Unsubscribe previous listener if exists
        if (unsubscribe.value) {
            unsubscribe.value();
            unsubscribe.value = null;
        }

        const userId = user.value.uid;
        const userGearsDocRef = doc(db, 'userGears', userId);

        // Use a Firestore transaction to create the initial userGears document if needed
        try {
            await runTransaction(db, async (transaction) => {
                const userGearsDocSnap = await transaction.get(userGearsDocRef);

                // Check if userGears document exists, or if gears field is empty (in case of data lost)
                if (
                    !userGearsDocSnap.exists() ||
                    isEmpty(userGearsDocSnap.data().gears)
                ) {
                    // get all user's gears
                    const gearDocs = await getDocs(
                        query(
                            gearCollectionRef,
                            where(
                                `role.${userId}`,
                                '==',
                                constants.ROLES.OWNER,
                            ),
                        ),
                    );
                    const userGears: UserGears = {};
                    gearDocs.forEach((gearDoc) => {
                        const gearData = gearDoc.data();
                        const gearId = gearDoc.id;
                        userGears[gearId] = formatDataToGearType(
                            gearId,
                            gearData,
                        );
                    });
                    transaction.set(userGearsDocRef, {
                        gears: userGears,
                        created: serverTimestamp(),
                    });
                }
            });
        } catch (err) {
            console.error('Error in Firestore transaction for userGears:', err);
        }

        // Listen to userGears document changes
        unsubscribe.value = onSnapshot(
            userGearsDocRef,
            async (doc) => {
                const docData = doc.data();
                if (!docData || !docData.gears) {
                    // Document creation is now handled by the transaction above
                    return;
                }

                const userGears = _cloneDeep(docData.gears) as UserGears;

                // fill in missing gear fields
                Object.entries(userGears).forEach(([gearId, gear]) => {
                    userGears[gearId] = formatDataToGearType(gearId, gear);
                });

                gearMap.value = userGears;

                if (isFirstFetching.value) {
                    isFirstFetching.value = false;
                }
            },
            (error) => {
                console.error(
                    'Error in onSnapshot listener for userGears:',
                    error,
                );
            },
        );

        isInitialized.value = true;
    };

    const destroy = () => {
        if (unsubscribe.value) {
            unsubscribe.value();
            unsubscribe.value = null;
        }

        // reset all ref values
        gearMap.value = {};
        isFirstFetching.value = true;
        isInitialized.value = false;
    };

    const createGear = async (
        editingGear: EditingGear,
    ): Promise<Gear | null> => {
        if (!user.value) {
            return null;
        }
        const userId = user.value.uid;
        let newGear: Gear | null = null;
        try {
            await runTransaction(db, async (transaction) => {
                // Create a new gear document reference with an auto-generated ID
                const gearDocRef = doc(gearCollectionRef);
                const gearId = gearDocRef.id;
                const gearData = buildNewGear(userId, editingGear);
                transaction.set(gearDocRef, gearData);

                // Add new gear to userGears document
                const userGearsDocRef = doc(db, 'userGears', userId);
                const formattedGear = formatDataToGearType(gearId, gearData);
                transaction.update(userGearsDocRef, {
                    [`gears.${gearId}`]: formattedGear,
                });
                newGear = formattedGear;
            });
            return newGear;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const createGears = async (gears: EditingGear[]) => {
        if (!user.value) {
            return;
        }
        const userId = user.value.uid;
        try {
            await runTransaction(db, async (transaction) => {
                const newGears: Gear[] = [];
                const userGearsDocRef = doc(db, 'userGears', userId);
                const newGearsFields: Record<string, Gear> = {};
                gears.forEach((gear) => {
                    // Create a new gear document reference with an auto-generated ID
                    const gearDocRef = doc(gearCollectionRef);
                    const gearId = gearDocRef.id;
                    const gearData = buildNewGear(userId, gear);
                    transaction.set(gearDocRef, gearData);

                    // Add new gear to userGears document
                    const formattedGear = formatDataToGearType(
                        gearId,
                        gearData,
                    );
                    newGears.push(formattedGear);
                    newGearsFields[`gears.${gearId}`] = formattedGear;
                });
                transaction.update(userGearsDocRef, newGearsFields);
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateGear = async ({
        id,
        gearData,
    }: {
        id: string;
        gearData: EditingGear;
    }) => {
        if (!user.value) {
            return;
        }
        const userId = user.value.uid;
        try {
            // use transaction to update gear data and userGears document
            await runTransaction(db, async (transaction) => {
                const gearRef = doc(db, 'gear', id);
                const userGearsDocRef = doc(db, 'userGears', userId);

                // Read the documents
                const [gearDocSnap, userGearsDocSnap] = await Promise.all([
                    transaction.get(gearRef),
                    transaction.get(userGearsDocRef),
                ]);
                if (!gearDocSnap.exists || !userGearsDocSnap.exists) {
                    throw new Error('Document does not exist');
                }

                const formattedGearData: any = {
                    ...gearData,
                    updated: serverTimestamp(),
                };
                delete formattedGearData.id; // remove id from gearData

                // archive / unarchive  gear
                const hasGearBeenArchived =
                    gearDocSnap.data()?.isArchived || false;
                if (!hasGearBeenArchived && gearData.isArchived === true) {
                    // set archived timestamp if isArchived is set from false to true
                    formattedGearData.archived = serverTimestamp();
                } else if (
                    hasGearBeenArchived &&
                    gearData.isArchived === false
                ) {
                    // clear archive data if isArchived is set from true to false (explicitly)
                    formattedGearData.isArchived = undefined;
                    formattedGearData.archived = undefined;
                    formattedGearData.archiveNote = undefined;
                    formattedGearData.archiveReason = undefined;
                }

                // update gear data
                const gearDataToUpdate = { ...formattedGearData };
                // replace undefined value with deleteField()
                Object.entries(gearDataToUpdate).forEach(([key, value]) => {
                    if (value === undefined) {
                        gearDataToUpdate[key] = deleteField();
                    }
                });
                transaction.update(gearRef, gearDataToUpdate);

                // update userGears document
                transaction.update(userGearsDocRef, {
                    [`gears.${id}`]: formatDataToGearType(id, {
                        ...gearMap.value[id],
                        ...formattedGearData,
                    }),
                });
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteGear = async (id: string) => {
        if (!user.value) {
            return;
        }
        const userId = user.value.uid;
        try {
            // use transaction to delete gear data and userGears document
            await runTransaction(db, async (transaction) => {
                const gearRef = doc(db, 'gear', id);
                const userGearsDocRef = doc(db, 'userGears', userId);

                // Read the documents
                const [gearDocSnap, userGearsDocSnap] = await Promise.all([
                    transaction.get(gearRef),
                    transaction.get(userGearsDocRef),
                ]);
                if (!gearDocSnap.exists || !userGearsDocSnap.exists) {
                    throw new Error('Document does not exist');
                }

                // delete gear data
                transaction.delete(gearRef);
                // delete userGears document
                transaction.update(userGearsDocRef, {
                    [`gears.${id}`]: deleteField(),
                });
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return {
        gears,
        gearMap,
        visibleGears,
        archivedGears,
        isFetchingGears: isFirstFetching,
        getGearById,
        initialize,
        destroy,
        createGear,
        createGears,
        updateGear,
        deleteGear,
    };
});
