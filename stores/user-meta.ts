import {
    getDoc,
    setDoc,
    updateDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';

export const useUserMetaStore = defineStore('userMetaStore', () => {
    const db = firebaseUtils.getFirestoreDB();
    const userStore = useUserStore();
    const { user } = storeToRefs(userStore);
    const userMeta = ref<UserMeta | null>(null);
    const isInitialized = ref(false);

    const initialize = async () => {
        if (isInitialized.value) return;
        if (!user.value) return;

        const docRef = doc(db, 'userMeta', user.value.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            userMeta.value = docSnap.data() as UserMeta;
        } else {
            // Create a new userMeta doc with default values
            // the counts are written by functions, which may create the doc
            // first: merge, to keep them
            const defaultMeta: Omit<UserMeta, 'lastUpdated'> = {
                userId: user.value.uid,
                locale: null,
                currency: null,
            };
            await setDoc(
                docRef,
                {
                    ...defaultMeta,
                    lastUpdated: serverTimestamp(),
                },
                { merge: true },
            );
            const newDocSnap = await getDoc(docRef);
            if (newDocSnap.exists()) {
                userMeta.value = newDocSnap.data() as UserMeta;
            }
        }

        // Set the locale for i18n if available
        const { $i18n } = useNuxtApp();
        const currentLocale = $i18n.locale.value as Locale;
        if (userMeta.value?.locale) {
            // Set the locale from userMeta
            $i18n.setLocale(userMeta.value.locale);
        } else if (constants.LOCALES.includes(currentLocale)) {
            // get locale and set it to userMeta
            updateUserMeta({
                locale: currentLocale,
            });
        }

        isInitialized.value = true;
    };

    const updateUserMeta = async (userMetaData: Partial<UserMeta>) => {
        if (!user.value || !userMeta.value) return;
        const docRef = doc(db, 'userMeta', user.value.uid);
        await updateDoc(docRef, {
            ...userMetaData,
            lastUpdated: serverTimestamp(),
        });
        userMeta.value = {
            ...userMeta.value,
            ...userMetaData,
        };
    };

    const destroy = () => {
        userMeta.value = null;
        isInitialized.value = false;
    };

    return {
        userMeta,
        initialize,
        updateUserMeta,
        destroy,
    };
});
