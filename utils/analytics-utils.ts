import { getApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

// firebase analytics logEvent
const log = (name: string, params?: Partial<Record<EventParamKey, any>>) => {
    // `demo-` projects only exist in the emulators, which have no analytics
    if (getApp().options.projectId?.startsWith('demo-')) {
        return;
    }
    const analytics = getAnalytics();
    logEvent(analytics, name, params);
};

export default {
    log,
};
