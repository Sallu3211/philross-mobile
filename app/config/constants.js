export const BuildType = 'dev'; // dev/prod

export const Constants = {
    // Force to use the working API server - no more local IP issues
    baseUrl: 'https://api.philross.com/',
    iosAppId: '6751194230',
    androidPackageName: 'com.philross',
    webDevUrl: 'https://web.philross.com/',

    // Legal pages — the live URLs the sign-up screen already links to.
    // (docs/privacy-policy.html and docs/terms-of-use.html in this repo are the
    // GitHub Pages copies kept for store review.)
    privacyPolicyUrl: 'https://philross.com/privacy-policy-terms-of-use',
    termsOfUseUrl: 'https://philross.com/privacy-policy-terms-of-use',

    // API Endpoints
    endpoints: {
        // Authentication
        login: 'accounts/login/',
        signup: 'accounts/signup/',
        forgotPassword: 'accounts/forgot-password/',
        resetPassword: 'accounts/reset-password/',
        tokenRefresh: 'accounts/token/refresh/',
        verifyOtp: 'accounts/verify-otp/',
        
        // User Management
        profile: 'accounts/profile/',
        intakeForm: 'accounts/intake-form/',
        
        // Content
        feed: 'feed/',
        feedCategories: 'feed/category/',
        workoutTypes: 'feed/workout_type/',
        courses: 'courses/',
        events: 'events/',
        products: 'products/',
        testimonials: 'testimonials/',
        
        // Support
        contact: 'contact/',
    }
}