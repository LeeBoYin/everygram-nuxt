// global state for archiving gear
const isOpenArchiveGearDialog = ref<boolean>(false);
const isEditingArchivedGear = ref<boolean>(false);
const archivingGear = ref<Gear | null>(null);

export default function () {
    const userGearsStore = useUserGearsStore();

    const archiveGear = async ({
        gear,
        archiveReason,
        archiveNote,
    }: {
        gear: Gear;
        archiveReason: GearArchiveReason;
        archiveNote: string;
    }) => {
        if (!gear || !archiveReason) {
            throw new Error('Gear and archive reason are required');
        }

        const updateData: EditingGear = {
            isArchived: true,
            archiveReason: archiveReason,
            ...(archiveNote ? { archiveNote } : {}),
        };

        await userGearsStore.updateGear({
            id: gear.id,
            gearData: updateData,
        });
    };

    const unarchiveGear = async (gear: Gear) => {
        const updateData: EditingGear = {
            isArchived: false,
        };

        await userGearsStore.updateGear({
            id: gear.id,
            gearData: updateData,
        });
    };

    return {
        isOpenArchiveGearDialog,
        isEditingArchivedGear,
        archivingGear,
        onArchiveGear: (gear: Gear) => {
            archivingGear.value = gear;
            isOpenArchiveGearDialog.value = true;
            isEditingArchivedGear.value = false;
        },
        onEditArchivedGear: (gear: Gear) => {
            archivingGear.value = gear;
            isOpenArchiveGearDialog.value = true;
            isEditingArchivedGear.value = true;
        },
        onCompleteArchiveGear: () => {
            isOpenArchiveGearDialog.value = false;
            isEditingArchivedGear.value = false;
            archivingGear.value = null;
        },
        onCancelArchiveGear: () => {
            isOpenArchiveGearDialog.value = false;
            isEditingArchivedGear.value = false;
            archivingGear.value = null;
        },
        archiveGear,
        unarchiveGear,
    };
}
