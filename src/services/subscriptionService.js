import { Platform } from 'react-native';
import Config from 'react-native-config';
import RazorpayCheckout from 'react-native-razorpay';
import { setPremiumStatus } from '../store/posterSlice';
import { mergeUserProfile } from '../utils/userStorage';
import {
    getSubscriptionStatusApi,
    verifySubscriptionApi,
} from '../apiService/subscriptionApi';

const SUBSCRIPTION_APP_NAME = 'CraftoClone';
const RAZORPAY_PLACEHOLDER_KEY = 'rzp_test_your_key_here';
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isPremiumPlanActive = subscriptionStatus => (
    subscriptionStatus?.is_active && subscriptionStatus?.plan_type && subscriptionStatus.plan_type !== 'FREE'
);

const getRazorpayKey = () => String(Config.RAZORPAY_KEY_ID ?? '').trim();

const isUuidV4 = value => UUID_V4_PATTERN.test(String(value ?? '').trim());

const ensureRazorpayKey = () => {
    const razorpayKey = getRazorpayKey();

    if (!razorpayKey || razorpayKey === RAZORPAY_PLACEHOLDER_KEY) {
        throw new Error('Missing Razorpay test key. Set RAZORPAY_KEY_ID in .env.');
    }

    return razorpayKey;
};

const toPaise = amountInInr => {
    const numericAmount = Number(amountInInr);
    return Number.isFinite(numericAmount) ? Math.max(0, Math.round(numericAmount * 100)) : 0;
};

export const syncSubscriptionStatus = async dispatch => {
    const response = await getSubscriptionStatusApi();
    const subscriptionStatus = response?.data?.data ?? {};
    const isPremium = isPremiumPlanActive(subscriptionStatus);

    await mergeUserProfile({ isPremium });

    if (dispatch) {
        dispatch(setPremiumStatus(isPremium));
    }

    return {
        ...subscriptionStatus,
        isPremium:true,
    };
};

export const startRazorpayTestCheckout = async ({ plan, profile }) => {
    if (!plan?.id) {
        throw new Error('Subscription plan is missing.');
    }
    if (!isUuidV4(plan.id)) {
        throw new Error('Backend returned an invalid plan id. Please use a real UUID plan id from /v1/subscriptions/plans.');
    }

    const amount = toPaise(plan?.price_inr);
    if (!amount) {
        throw new Error('Invalid subscription plan amount.');
    }

    const key = ensureRazorpayKey();
    const personalMobile = profile?.premiumProfile?.personal?.mobileNumber;
    const businessMobile = profile?.premiumProfile?.business?.contactMobileNumber;

    return RazorpayCheckout.open({
        key,
        amount,
        currency: 'INR',
        name: SUBSCRIPTION_APP_NAME,
        description: plan?.description ?? plan?.name ?? 'Premium Subscription',
        prefill: {
            name: profile?.name ?? '',
            contact: personalMobile || businessMobile || '',
        },
        notes: {
            env: 'test',
            plan_id: plan.id,
            plan_name: plan?.name ?? '',
        },
        theme: {
            color: '#5B6CFF',
        },
    });
};

export const verifySubscriptionPurchaseAndSync = async ({ checkoutResponse, planId, dispatch }) => {
    if (!planId) {
        throw new Error('Plan id is required for subscription verification.');
    }
    if (!isUuidV4(planId)) {
        throw new Error('Subscription verification requires a real UUID plan id. Current plan id from the plans API is invalid.');
    }

    const purchaseToken = JSON.stringify({
        gateway: 'razorpay',
        razorpay_payment_id: checkoutResponse?.razorpay_payment_id ?? '',
        razorpay_order_id: checkoutResponse?.razorpay_order_id ?? '',
        razorpay_signature: checkoutResponse?.razorpay_signature ?? '',
    });

    await verifySubscriptionApi({
        platform: Platform.OS,
        purchase_token: purchaseToken,
        plan_id: planId,
    });

    return syncSubscriptionStatus(dispatch);
};
