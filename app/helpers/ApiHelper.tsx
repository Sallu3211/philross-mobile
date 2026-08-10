import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Constants } from '../config/constants';
import Utils from './Utilities';
import { getLoginSubscriptionParams } from '../../src/services/subscriptionService';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import DeviceInfo from 'react-native-device-info';

export interface ApiInterface {
    endPoint: string,
    method: MethodType,
    data?: object,
    isMultipart?: boolean,
    navigation: any,
}
export type MethodType = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'

export const get = async (api: AxiosInstance, url: string, params?: object) => {
    try {
        const response = await api.get(url, { params });
        console.log(`get response ${url} ${JSON.stringify(params)} >>> `, JSON.stringify(response.data))
        return response.data;
    } catch (error: any) {
        console.log(`get response error ${url} ${JSON.stringify(params)} >>> `, JSON.stringify(error));
        
        // Handle array messages properly
        let errorMessage = 'Request failed';
        
        if (error?.response?.data?.errors?.error?.[0]) {
            errorMessage = error.response.data.errors.error[0];
        } else if (error?.response?.data?.message) {
            if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message[0];
            } else if (typeof error.response.data.message === 'string') {
                errorMessage = error.response.data.message;
            } else if (typeof error.response.data.message === 'object') {
                // Handle nested field-specific errors like {"email": ["User with this email already exists."]}
                const fieldErrors = error.response.data.message;
                const firstField = Object.keys(fieldErrors)[0];
                if (firstField && Array.isArray(fieldErrors[firstField])) {
                    errorMessage = fieldErrors[firstField][0];
                } else {
                    errorMessage = JSON.stringify(fieldErrors);
                }
            }
        }
        
        return { 
            success: false, 
            message: errorMessage,
            fieldErrors: error?.response?.data?.message || null, // Pass field errors for UI highlighting
            // Callers need to tell "the server said no" from "there is no such
            // endpoint" — a 404 is a missing API, not a user mistake.
            httpStatus: error?.response?.status ?? null
        };
    }
};

export const put = async (api: AxiosInstance, url: string, data: object) => {
    try {
        const response:any = await api.put(url, data,);
        console.log(`put response ${url} ${JSON.stringify(data)} >>> `, JSON.stringify(response.data))
        return response.data;
    } catch (error:any) {
        console.log(`put response error ${url} ${JSON.stringify(data)} >>> `, JSON.stringify(error))
        
        // Handle array messages properly
        let errorMessage = 'Request failed';
        
        if (error?.response?.data?.errors?.error?.[0]) {
            errorMessage = error.response.data.errors.error[0];
        } else if (error?.response?.data?.message) {
            if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message[0];
            } else if (typeof error.response.data.message === 'string') {
                errorMessage = error.response.data.message;
            } else if (typeof error.response.data.message === 'object') {
                // Handle nested field-specific errors like {"email": ["User with this email already exists."]}
                const fieldErrors = error.response.data.message;
                const firstField = Object.keys(fieldErrors)[0];
                if (firstField && Array.isArray(fieldErrors[firstField])) {
                    errorMessage = fieldErrors[firstField][0];
                } else {
                    errorMessage = JSON.stringify(fieldErrors);
                }
            }
        }
        
        return { 
            success: false, 
            message: errorMessage,
            fieldErrors: error?.response?.data?.message || null, // Pass field errors for UI highlighting
            // Callers need to tell "the server said no" from "there is no such
            // endpoint" — a 404 is a missing API, not a user mistake.
            httpStatus: error?.response?.status ?? null
        };
    }
};

export const post = async (api: AxiosInstance, url: string, data: object,) => {
    try {
        const response = await api.post(url, data,);
        console.log(`post response ${url} ${JSON.stringify(data)} >>> `, JSON.stringify(response.data))
        return response.data;
    } catch (error:any) {
        console.log(`post response error ${url} ${JSON.stringify(data)} >>> `, JSON.stringify(error))
        
        // Handle array messages properly
        let errorMessage = 'Request failed';
        
        if (error?.response?.data?.errors?.error?.[0]) {
            errorMessage = error.response.data.errors.error[0];
        } else if (error?.response?.data?.message) {
            if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message[0];
            } else if (typeof error.response.data.message === 'string') {
                errorMessage = error.response.data.message;
            } else if (typeof error.response.data.message === 'object') {
                // Handle nested field-specific errors like {"email": ["User with this email already exists."]}
                const fieldErrors = error.response.data.message;
                const firstField = Object.keys(fieldErrors)[0];
                if (firstField && Array.isArray(fieldErrors[firstField])) {
                    errorMessage = fieldErrors[firstField][0];
                } else {
                    errorMessage = JSON.stringify(fieldErrors);
                }
            }
        }
        
        return { 
            success: false, 
            message: errorMessage,
            fieldErrors: error?.response?.data?.message || null, // Pass field errors for UI highlighting
            // Callers need to tell "the server said no" from "there is no such
            // endpoint" — a 404 is a missing API, not a user mistake.
            httpStatus: error?.response?.status ?? null
        };
    }
};

export const patch = async (api: AxiosInstance, url: string, data: object) => {
    try {
        const response = await api.patch(url, data);
        console.log(`patch response ${url} ${JSON.stringify(data)} >>> `, JSON.stringify(response.data))
        return response.data;
    } catch (error:any) {
        console.log(`patch response error ${url} ${JSON.stringify(data)} >>> `, JSON.stringify(error))
        
        // Handle array messages properly
        let errorMessage = 'Request failed';
        
        if (error?.response?.data?.errors?.error?.[0]) {
            errorMessage = error.response.data.errors.error[0];
        } else if (error?.response?.data?.message) {
            if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message[0];
            } else if (typeof error.response.data.message === 'string') {
                errorMessage = error.response.data.message;
            } else if (typeof error.response.data.message === 'object') {
                // Handle nested field-specific errors like {"email": ["User with this email already exists."]}
                const fieldErrors = error.response.data.message;
                const firstField = Object.keys(fieldErrors)[0];
                if (firstField && Array.isArray(fieldErrors[firstField])) {
                    errorMessage = fieldErrors[firstField][0];
                } else {
                    errorMessage = JSON.stringify(fieldErrors);
                }
            }
        }
        
        return { 
            success: false, 
            message: errorMessage,
            fieldErrors: error?.response?.data?.message || null, // Pass field errors for UI highlighting
            // Callers need to tell "the server said no" from "there is no such
            // endpoint" — a 404 is a missing API, not a user mistake.
            httpStatus: error?.response?.status ?? null
        };
    }
};

export const del = async (api: AxiosInstance, url: string, params?: object) => {
    try {
        const response = await api.delete(url, { params });
        console.log(`del response ${url} ${JSON.stringify(params)} >>> `, JSON.stringify(response.data))
        return response.data;
    } catch (error:any) {
        console.log(`del response error ${url} ${JSON.stringify(params)} >>> `, JSON.stringify(error))
        
        // Handle array messages properly
        let errorMessage = 'Request failed';
        
        if (error?.response?.data?.errors?.error?.[0]) {
            errorMessage = error.response.data.errors.error[0];
        } else if (error?.response?.data?.message) {
            if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message[0];
            } else if (typeof error.response.data.message === 'string') {
                errorMessage = error.response.data.message;
            } else if (typeof error.response.data.message === 'object') {
                // Handle nested field-specific errors like {"email": ["User with this email already exists."]}
                const fieldErrors = error.response.data.message;
                const firstField = Object.keys(fieldErrors)[0];
                if (firstField && Array.isArray(fieldErrors[firstField])) {
                    errorMessage = fieldErrors[firstField][0];
                } else {
                    errorMessage = JSON.stringify(fieldErrors);
                }
            }
        }
        
        return { 
            success: false, 
            message: errorMessage,
            fieldErrors: error?.response?.data?.message || null, // Pass field errors for UI highlighting
            // Callers need to tell "the server said no" from "there is no such
            // endpoint" — a 404 is a missing API, not a user mistake.
            httpStatus: error?.response?.status ?? null
        };
    }
};

// Login API function
export const login = async (userData: {
    email: string;
    password: string;
}, navigation: any) => {
    try {
        // Get subscription parameters (always returns data, null if not subscribed)
        // let subscriptionParams = await getLoginSubscriptionParams();
        
        // ⭐ VALIDATION: Cancel logic if no payment data
        // if (subscriptionParams.is_subscribed_user && !subscriptionParams.revenue_cat_payload) {
        //     console.log('⚠️ Subscription flag set but no payload - resetting to not subscribed');
        //     subscriptionParams = {
        //         is_subscribed_user: false,
        //         revenue_cat_payload: null,
        //         revenue_cat_app_user_id: null,
        //     };
        // }
        
        // console.log('🔐 Login with subscription params:', {
        //     email: userData.email,
        //     is_subscribed_user: subscriptionParams.is_subscribed_user,
        //     has_revenue_cat_payload: subscriptionParams.revenue_cat_payload !== null,
        //     revenue_cat_app_user_id: subscriptionParams.revenue_cat_app_user_id,
        // });

        const revenue_cat_app_user_id = await Purchases.getAppUserID();
        const device_id = await DeviceInfo.getUniqueId();

        const loginData = {
            email: userData.email,
            password: userData.password,
            revenue_cat_app_user_id,
            device_id,
        };

        const response = await apiCall({
            endPoint: 'accounts/login/',
            method: 'POST',
            data: loginData,
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
};

// Sign Up API function
export const signUp = async (userData: {
    email: string;
    password: string;
    fullName: string;
    confirmPassword?: string;
}, navigation: any) => {
    try {
        // Get subscription parameters (always returns data, null if not subscribed)
        // let subscriptionParams = await getLoginSubscriptionParams();
        
        // ⭐ VALIDATION: Cancel logic if no payment data
        // if (subscriptionParams.is_subscribed_user && !subscriptionParams.revenue_cat_payload) {
        //     console.log('⚠️ Subscription flag set but no payload - resetting to not subscribed');
        //     subscriptionParams = {
        //         is_subscribed_user: false,
        //         revenue_cat_payload: null,
        //         revenue_cat_app_user_id: null,
        //     };
        // }
        
        // console.log('📝 Signup with subscription params:', {
        //     email: userData.email,
        //     is_subscribed_user: subscriptionParams.is_subscribed_user,
        //     has_revenue_cat_payload: subscriptionParams.revenue_cat_payload !== null,
        //     revenue_cat_app_user_id: subscriptionParams.revenue_cat_app_user_id,
        // });

        const revenue_cat_app_user_id = await Purchases.getAppUserID();
        const device_id = await DeviceInfo.getUniqueId();

        const signUpData = {
            email: userData.email,
            password: userData.password,
            full_name: userData.fullName,
            confirm_password: userData.confirmPassword || userData.password,
            revenue_cat_app_user_id,
            device_id,
        };

        const response = await apiCall({
            endPoint: 'accounts/signup/',
            method: 'POST',
            data: signUpData,
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Sign Up Error:', error);
        return { success: false, message: 'Sign up failed. Please try again.' };
    }
};

// Forgot Password API function
export const forgotPassword = async (email: string, navigation: any) => {
    try {
        const forgotPasswordData = {
            email: email
        };

        const response = await apiCall({
            endPoint: 'accounts/forgot-password/',
            method: 'POST',
            data: forgotPasswordData,
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return { success: false, message: 'Password reset request failed. Please try again.' };
    }
};

// Reset Password API function
export const resetPassword = async (resetData: {
    token: string;
    new_password: string;
    confirm_password: string;
}, navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: 'accounts/reset-password/',
            method: 'POST',
            data: resetData,
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Reset Password Error:', error);
        return { success: false, message: 'Password reset failed. Please try again.' };
    }
};

// Forgot Password Request API function
export const forgotPasswordRequest = async (email: string, navigation: any) => {
    try {
        const forgotPasswordData = {
            email: email
        };

        const response = await apiCall({
            endPoint: 'accounts/forgot-password/request/',
            method: 'POST',
            data: forgotPasswordData,
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Forgot Password Request Error:', error);
        return { success: false, message: 'Password reset request failed. Please try again.' };
    }
};



// Forgot Password Reset API function
export const forgotPasswordReset = async (resetData: {
    email: string;
    new_password: string;
    confirm_password: string;
}, navigation: any) => {
    try {
        // Send data in the format backend expects
        const apiData = {
            email: resetData.email,
            password: resetData.new_password,
            password_confirmation: resetData.confirm_password,
            // Alternative field names that might be expected
            new_password: resetData.new_password,
            confirm_password: resetData.confirm_password
        };

        console.log('Sending password reset data:', apiData);

        const response = await apiCall({
            endPoint: 'accounts/forgot-password/reset/',
            method: 'POST',
            data: apiData,
            navigation: navigation,
            isMultipart: true // Try sending as form data
        });

        console.log('Password reset API response:', response);
        return response;
    } catch (error) {
        console.error('Forgot Password Reset Error:', error);
        return { success: false, message: 'Password reset failed. Please try again.' };
    }
};

// Social Authentication API function (handles both Google and Apple)
export const socialAuthLogin = async (authData: {
    provider: 'google' | 'apple';
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
}, navigation: any) => {
    try {
        // Get subscription parameters (always returns data, null if not subscribed)
        // let subscriptionParams = await getLoginSubscriptionParams();
        
        // ⭐ VALIDATION: Cancel logic if no payment data
        // if (subscriptionParams.is_subscribed_user && !subscriptionParams.revenue_cat_payload) {
        //     console.log('⚠️ Subscription flag set but no payload - resetting to not subscribed');
        //     subscriptionParams = {
        //         is_subscribed_user: false,
        //         revenue_cat_payload: null,
        //         revenue_cat_app_user_id: null,
        //     };
        // }
        
        // console.log('🔐 Social auth with subscription params:', {
        //     provider: authData.provider,
        //     email: authData.email,
        //     is_subscribed_user: subscriptionParams.is_subscribed_user,
        //     has_revenue_cat_payload: subscriptionParams.revenue_cat_payload !== null,
        //     revenue_cat_app_user_id: subscriptionParams.revenue_cat_app_user_id,
        // });

        const revenue_cat_app_user_id = await Purchases.getAppUserID();
        const device_id = await DeviceInfo.getUniqueId();

        const socialAuthData = {
            provider: authData.provider,
            sub: authData?.sub,
            name: authData?.name,
            email: authData?.email,
            picture: authData?.picture,
            emailVerified: true,
            revenue_cat_app_user_id,
            device_id,
        };
        console.log('Sending social auth data:', socialAuthData);
        const response = await apiCall({
            endPoint: 'accounts/social-auth-login/',
            method: 'POST',
            data: socialAuthData,
            navigation: navigation,
            isMultipart: false
        });
        console.log('Social auth API response:', response);
        return response;
    } catch (error) {
        console.error('Social Auth Error:', error);
        return { success: false, message: 'Social authentication failed. Please try again.' };
    }
};

// Feed API Functions
export const getFeedList = async (navigation: any, params?: {
    page?: number;
    limit?: number;
    category?: string | string[];
    workout_type?: string | string[];
}) => {
    try {
        let endPoint = 'feed/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            
            // Handle multiple categories
            if (params.category) {
                if (Array.isArray(params.category)) {
                    params.category.forEach(cat => queryParams.append('category', cat));
                } else {
                    queryParams.append('category', params.category);
                }
            }
            
            // Handle multiple workout types
            if (params.workout_type) {
                if (Array.isArray(params.workout_type)) {
                    params.workout_type.forEach(wt => queryParams.append('workout_type', wt));
                } else {
                    queryParams.append('workout_type', params.workout_type);
                }
            }
            
            if (queryParams.toString()) {
                endPoint += `?${queryParams.toString()}`;
            }
        }
        
        const response = await apiCall({
            endPoint: endPoint,
            method: 'GET',
            data: {},
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Get Feed List Error:', error);
        return { success: false, message: 'Failed to fetch feed items.' };
    }
};

export const getFeedCategories = async (navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: 'feed/category/',
            method: 'GET',
            data: {},
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error: any) {
        console.error('Get Feed Categories Error:', error);
        return { success: false, data: [], message: 'Failed to fetch feed categories.' };
    }
};

export const getWorkoutTypes = async (navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: 'feed/workout_type/',
            method: 'GET',
            data: {},
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Get Workout Types Error:', error);
        return { success: false, message: 'Failed to fetch workout types.' };
    }
};

export const getFeedItem = async (slug: string, navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: `feed/${slug}/`,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        return response;
    } catch (error) {
        console.error('Get Feed Item Error:', error);
        return { success: false, message: 'Failed to fetch feed item.' };
    }
};

// Course API Functions
export const getCourseList = async (navigation: any, params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty_level?: string;
    search?: string;
}) => {
    try {
        let endPoint = 'course/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.category) queryParams.append('category', params.category);
            if (params.difficulty_level) queryParams.append('difficulty_level', params.difficulty_level);
            if (params.search) queryParams.append('search', params.search);
            
            if (queryParams.toString()) {
                endPoint += `?${queryParams.toString()}`;
            }
        }
        
        console.log('🔍 getCourseList calling endpoint:', endPoint);
        
        const response = await apiCall({
            endPoint: endPoint,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        
        console.log('🔍 getCourseList raw response:', response);
        return response;
    } catch (error) {
        console.error('Get Course List Error:', error);
        return { success: false, message: 'Failed to fetch courses.' };
    }
};

export const getCourseDetail = async (courseId: number, courseSlug: string, navigation: any) => {
    try {
        console.log('🔍 getCourseDetail - getting course details for ID:', courseId, 'and slug:', courseSlug);
        
        // Use the slug-based endpoint that actually works
        const response = await apiCall({
            endPoint: `course/${courseSlug}/`,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        
        console.log('🔍 getCourseDetail response:', response);
        
        // Return the response directly since it should contain the course data
        return response;
        
    } catch (error) {
        console.error('Get Course Detail Error:', error);
        return { status: false, message: 'Failed to fetch course details.' };
    }
};

export const enrollInCourse = async (courseSlug: string, navigation: any) => {
    try {
        console.log('🔍 enrollInCourse - enrolling in course with slug:', courseSlug);
        
        const response = await apiCall({
            endPoint: `course/${courseSlug}/enrollment/`,
            method: 'POST',
            data: {},
            navigation: navigation,
            isMultipart: false
        });
        
        console.log('🔍 enrollInCourse response:', response);
        
        return response;
        
    } catch (error) {
        console.error('Enroll In Course Error:', error);
        return { status: false, message: 'Failed to enroll in course.' };
    }
};

export const updateVideoProgress = async (videoData: {
    video_id: number;
    course_id: number;
    watch_percentage: number;
    is_completed: boolean;
}, navigation: any) => {
    try {
        console.log('📊 Updating video progress:', videoData);
        
        // The body used to be entirely commented out, so the server received a
        // bare ping and could never know how far through a video anyone was —
        // which is why `course_completed` comes back as "0 %" no matter how
        // much has been watched. The fields are sent now; a backend that
        // ignores unknown keys is unaffected, one that reads them starts
        // recording real progress.
        const response = await apiCall({
            endPoint: `course/${videoData.video_id}/video_watched/`,
            method: 'POST',
            data: {
                video_id: videoData.video_id,
                course_id: videoData.course_id,
                watch_percentage: videoData.watch_percentage,
                is_completed: videoData.is_completed,
            },
            navigation: navigation,
            isMultipart: false
        });
        
        console.log('📊 Video progress update response:', response);
        return response;
    } catch (error) {
        console.error('Update Video Progress Error:', error);
        return { success: false, message: 'Failed to update video progress.' };
    }
};

export const getVideoProgress = async (videoId: number, courseId: number, navigation: any) => {
    try {
        console.log('📊 Getting video progress for video:', videoId, 'course:', courseId);
        
        // Since there's no direct video progress GET endpoint, we'll return a fallback
        // The progress will be tracked locally and sent via POST when videos are watched
        return { 
            success: true, 
            data: { 
                watch_percentage: 0,
                is_completed: false 
            } 
        };
    } catch (error) {
        console.error('Get Video Progress Error:', error);
        return { success: false, message: 'Failed to fetch video progress.' };
    }
};

export const getCourseProgress = async (courseId: number, navigation: any) => {
    try {
        console.log('📊 Getting course progress for course:', courseId);
        
        // Since there's no direct course progress endpoint, we'll return a fallback
        // The actual progress will be calculated from individual video progress
        return { 
            success: true, 
            data: { 
                progress: 0,
                completion_percentage: 0 
            } 
        };
    } catch (error) {
        console.error('Get Course Progress Error:', error);
        return { success: false, message: 'Failed to fetch course progress.' };
    }
};

/* ── Tutorial (feed) completion ──────────────────────────────────────────────
 *
 * These call endpoints the API does not serve yet. They are written now, and
 * wired into src/services/tutorialProgress.ts, so that the day the backend
 * ships them the app starts syncing with no further change: progress will
 * follow the account across devices and survive a reinstall.
 *
 * Until then both return `serverUnsupported` and the service falls back to its
 * on-device cache. See BACKEND-REQUIREMENTS.md for the exact contract.
 */

/** GET /feed/progress/ → { data: [{ slug, is_completed, completed_at }] } */
export const getFeedProgress = async (navigation: any) => {
    try {
        const response: any = await apiCall({
            endPoint: 'feed/progress/',
            method: 'GET',
            navigation,
            isMultipart: false,
        });

        if (response?.httpStatus === 404) {
            return { success: false, serverUnsupported: true };
        }
        return response;
    } catch (error) {
        return { success: false, message: 'Failed to fetch tutorial progress.' };
    }
};

/** POST /feed/{slug}/completed/ ← { is_completed } */
export const setFeedCompleted = async (
    slug: string,
    isCompleted: boolean,
    navigation: any,
) => {
    try {
        const response: any = await apiCall({
            endPoint: `feed/${slug}/completed/`,
            method: 'POST',
            data: { is_completed: isCompleted },
            navigation,
            isMultipart: false,
        });

        if (response?.httpStatus === 404) {
            return { success: false, serverUnsupported: true };
        }
        return response;
    } catch (error) {
        return { success: false, message: 'Failed to save tutorial progress.' };
    }
};

// Products API Functions
export const getProductList = async (navigation: any, params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    price_min?: number;
    price_max?: number;
}) => {
    try {
        // Use the correct product endpoint
        const possibleEndpoints = ['product/'];
        let response = null;
        let lastError = null;
        
        for (const endpoint of possibleEndpoints) {
            try {
                let endPoint = endpoint;
                if (params) {
                    const queryParams = new URLSearchParams();
                    if (params.page) queryParams.append('page', params.page.toString());
                    if (params.limit) queryParams.append('limit', params.limit.toString());
                    if (params.category) queryParams.append('category', params.category);
                    if (params.search) queryParams.append('search', params.search);
                    if (params.price_min) queryParams.append('price_min', params.price_min.toString());
                    if (params.price_max) queryParams.append('price_max', params.price_max.toString());
                    
                    if (queryParams.toString()) {
                        endPoint += `?${queryParams.toString()}`;
                    }
                }
                
            
                
                response = await apiCall({
                    endPoint: endPoint,
                    method: 'GET',
                    navigation: navigation,
                    isMultipart: false
                });
                
           
                
                // If we get a successful response, break out of the loop
                if (response && (response.success !== false && response.status !== false)) {
                    console.log('🛍️ Success with endpoint:', endPoint);
                    break;
                } else {
                    console.log('🛍️ Endpoint', endPoint, 'returned failure, trying next...');
                    lastError = response;
                }
            } catch (error) {
                console.log('🛍️ Endpoint', endpoint, 'failed with error:', error);
                lastError = error;
            }
        }
        
        if (response && (response.success !== false && response.status !== false)) {
            return response;
        } else {
            console.error('🛍️ All endpoints failed. Last error:', lastError);
            return { success: false, message: 'Failed to fetch products from all endpoints.' };
        }
        
    } catch (error) {
        console.error('Get Product List Error:', error);
        return { success: false, message: 'Failed to fetch products.' };
    }
};

export const getProductDetail = async (productSlug: string, navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: `product/${productSlug}/`,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        
        return response;
        
    } catch (error) {
        console.error('Get Product Detail Error:', error);
        return { status: false, message: 'Failed to fetch product details.' };
    }
};

export const getProductCategories = async (navigation: any) => {
    try {
        console.log('🛍️ Calling product categories API: product/categories/');
        const response = await apiCall({
            endPoint: 'product/categories/',
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });

        console.log('🛍️ Product categories API response:', response);
        return response;
    } catch (error) {
        console.error('🛍️ Get Product Categories Error:', error);
        return { success: false, data: [], message: 'Failed to fetch product categories.' };
    }
};

// Events API Functions
export const getEventList = async (navigation: any, params?: {
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    search?: string;
    category?: string;
    start_date?: string;
    end_date?: string;
}) => {
    try {
        let endPoint = 'events/events/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.latitude) queryParams.append('latitude', params.latitude.toString());
            if (params.longitude) queryParams.append('longitude', params.longitude.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.category) queryParams.append('category', params.category);
            if (params.start_date) queryParams.append('start_date', params.start_date);
            if (params.end_date) queryParams.append('end_date', params.end_date);
            
            if (queryParams.toString()) {
                endPoint += `?${queryParams.toString()}`;
            }
        }
        
        const response = await apiCall({
            endPoint: endPoint,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        return response;
    } catch (error) {
        console.error('Get Event List Error:', error);
        return { success: false, message: 'Failed to fetch events.' };
    }
};

export const getEventDetail = async (eventSlug: string, navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: `events/events/${eventSlug}/`,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        
        return response;
        
    } catch (error) {
        console.error('Get Event Detail Error:', error);
        return { status: false, message: 'Failed to fetch event details.' };
    }
};

export const getEventCategories = async (navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: 'events/category/',
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });

        return response;
    } catch (error) {
        console.error('Get Event Categories Error:', error);
        return { success: false, data: [], message: 'Failed to fetch event categories.' };
    }
};

// My Coach API Functions
export const getCoachList = async (navigation: any, params?: {
    page?: number;
    limit?: number;
    search?: string;
}) => {
    try {
        let endPoint = 'my_coach/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.search) queryParams.append('search', params.search);
            
            if (queryParams.toString()) {
                endPoint += `?${queryParams.toString()}`;
            }
        }
        
        const response = await apiCall({
            endPoint: endPoint,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        
        return response;
    } catch (error) {
        console.error('Get Coach List Error:', error);
        return { success: false, message: 'Failed to fetch coaches.' };
    }
};

export const getCoachDetail = async (coachSlug: string, navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: `my_coach/${coachSlug}/`,
            method: 'GET',
            navigation: navigation,
            isMultipart: false
        });
        
        return response;
        
    } catch (error) {
        console.error('Get Coach Detail Error:', error);
        return { status: false, message: 'Failed to fetch coach details.' };
    }
};

export const submitIntakeForm = async (formData: any, navigation: any) => {
    try {
        console.log('🚀 Submitting intake form with data:', formData);
        
        const response = await apiCall({
            endPoint: 'my_coach/intake_form/',
            method: 'POST',
            data: formData,
            navigation: navigation,
            isMultipart: true
        });
        
        console.log('📋 Intake form response:', response);
        return response;
        
    } catch (error) {
        console.error('❌ Submit Intake Form Error:', error);
        return { status: false, message: 'Failed to submit intake form.' };
    }
};

export const apiCall = async (props: ApiInterface) => {
    const { endPoint, method, data, isMultipart, navigation } = props

    console.log(`apiCall >>> ${Constants.baseUrl + endPoint} ${JSON.stringify(data)} ${method} >>> `)

    const api: AxiosInstance = axios.create({
        baseURL: Constants.baseUrl,
        timeout: 10000,
        headers: { 'Content-Type': !isMultipart ? 'application/json' : 'multipart/form-data' },
    });

    api.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
                console.log('No Internet Connection')
                return Promise.reject(new Error('No Internet Connection'));
            }
            
            // Use dynamic token for feed-related endpoints
            if (config.url && (config.url.includes('feed/') || config.url.includes('workout_type/'))) {
                const authToken = await EncryptedStorage.getItem('authToken');
                if (Utils.isValidString(authToken)) {
                    config.headers.Authorization = `Bearer ${authToken}`;
                }
            } else {
                const authToken = await EncryptedStorage.getItem('authToken');
                if (Utils.isValidString(authToken) && endPoint !== 'accounts/login/' && endPoint !== 'accounts/signup/' && endPoint !== 'accounts/forgot-password/') {
                    config.headers.Authorization = `Bearer ${authToken}`
                }
            }
            
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    api.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        (error) => {
            if (error?.response) {
                const status_code = error?.response?.data?.status || error?.response?.status;
                switch (status_code) {
                    case 400:
                        console.error('Bad Request', JSON.stringify(error.response.data));
                        break;
                    case 401:
                        console.error('Unauthorized', error.response.data);
                        if (endPoint !== 'accounts/login/' && endPoint !== 'accounts/signup/' && endPoint !== 'accounts/forgot-password/') {
                            Utils.logout(navigation);
                        }
                        break;
                    case 403:
                        console.error('Forbidden', error.response.data);
                        return error.response;
                    case 404:
                        console.error('Not Found', error.response.data);
                        break;
                    case 500:
                        console.error('Internal Server Error', error.response.data);
                        break;
                    default:
                        console.error(`Error ${status_code}`, error.response.data);
                        break;
                }
            } else if (error.request) {
                console.error('No response received', error);
            } else {
                console.error('Error', error.message);
            }
            return Promise.reject(error);
        }
    );

    switch (method) {
        case 'GET':
            return await get(api, endPoint, data || {})
        case 'PUT':
            return await put(api, endPoint, data || {})
        case 'POST':
            return await post(api, endPoint, data || {})
        case 'PATCH':
            return await patch(api, endPoint, data || {})
        case 'DELETE':
            return await del(api, endPoint, data || {})
    }

}

// Delete Account
export const deleteAccount = async (navigation: any) => {
    try {
        let endPoint = 'accounts/delete-account/';
        const response = await apiCall({ endPoint: endPoint, method: 'DELETE', navigation: navigation, });
        return response;
    } catch (error) {
        console.error('Get Coach List Error:', error);
        return { success: false, message: 'Failed to delete account.' };
    }
};

// Profile — read the signed-in user's details
export const getProfile = async (navigation: any) => {
    try {
        const response = await apiCall({
            endPoint: 'accounts/profile/',
            method: 'GET',
            navigation: navigation,
        });
        return response;
    } catch (error) {
        console.error('Get Profile Error:', error);
        return { success: false, message: 'Failed to load your profile.' };
    }
};

/**
 * Profile — update editable fields.
 *
 * The backend models the name as a single `full_name` — the same field signup
 * posts. An earlier version sent first_name/last_name, which the endpoint
 * rejected, and the app showed a bare "Request failed".
 *
 * Tries PATCH then falls back to PUT, since nothing in this codebase documents
 * which the endpoint accepts. Returns the server's own message when there is
 * one, so a failure is diagnosable instead of generic.
 */
export const updateProfile = async (
    data: { full_name?: string },
    navigation: any,
) => {
    const attempt = (method: 'PATCH' | 'PUT') =>
        apiCall({
            endPoint: 'accounts/profile/',
            method,
            data,
            navigation,
            isMultipart: false,
        });

    const ok = (r: any) => !!r && r.success !== false && r.status !== false;

    try {
        const patched: any = await attempt('PATCH');
        if (ok(patched)) return patched;

        // A 404 means the route does not exist, so retrying with another verb
        // on the same URL cannot help.
        //
        // Verified against the live OpenAPI schema (GET /swagger/?format=openapi,
        // Aug 2026): the API is 30 endpoints and NONE of them read or write a
        // profile. `accounts/` serves only signup, login, verify-otp,
        // token/refresh, social-auth-login, forgot-password/* and
        // delete-account. There is no workaround on the API side.
        //
        // `serverUnsupported` lets the caller fall back to saving on the
        // device, so the name at least takes effect in the app. Remove that
        // fallback the day the endpoint lands — this function already sends
        // exactly the right request and will simply start succeeding.
        if (patched?.httpStatus === 404) {
            return {
                success: false,
                serverUnsupported: true,
                message:
                    'Saved on this device. Your name will sync once the server ' +
                    'supports profile updates.',
            };
        }

        console.log('updateProfile: PATCH rejected, retrying as PUT', patched);
        const put: any = await attempt('PUT');
        if (ok(put)) return put;

        // Surface whichever response actually carries a readable message.
        return put?.message ? put : patched;
    } catch (error: any) {
        console.error('Update Profile Error:', error);
        return {
            success: false,
            message: error?.message ?? 'Failed to update your profile.',
        };
    }
};