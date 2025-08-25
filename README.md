# Everygram

[![Netlify Status](https://api.netlify.com/api/v1/badges/4a7a03d0-7095-41e5-903c-cb81c8fa72a0/deploy-status)](https://app.netlify.com/sites/everygram/deploys)

## Count Every Gram, Every Gram Counts

Welcome to Everygram, the ultimate web app designed for hiking enthusiasts who understand the importance of meticulous weight management. Everygram empowers you to create detailed gear lists for your hiking trips, ensuring that every gram is accounted for and optimized for a lighter, more efficient backpacking experience.

## Why Everygram?

Hiking can be an exhilarating adventure, but carrying a heavy pack can quickly turn the journey into a burden. With Everygram, you can effortlessly track and manage the weight of your gear, helping you make informed decisions about what to carry. Our app breaks down your gear into essential categories—pack weight, base weight, and consumable weight—giving you a clear overview of your load distribution.

## Key Features

-   **Gear List Creation**: Easily create and organize lists for all your hiking trips. Add each piece of gear with its weight to keep a precise inventory.
-   **Weight Calculation**: Automatically calculate the total pack weight, base weight, and consumable weight. See how much each category contributes to your overall load.
-   **Weight Distribution Visualization**: Get a visual representation of your gear’s weight distribution. Quickly identify areas where you can cut down on weight.
-   **Optimized Packing**: Use the insights provided by Everygram to make smarter packing choices. Aim for a lighter pack without sacrificing essential gear.

## How It Works

1. **Create a Trip**: Start by creating a new hiking trip in Everygram.
2. **Add Your Gear**: Enter each item you plan to take along, specifying its weight.
3. **Categorize Your Gear**: Assign items to categories such as pack weight, base weight, and consumable weight.
4. **Analyze the Data**: Review the calculated totals and distribution charts to understand the weight impact of each item.
5. **Optimize Your Pack**: Use the insights to adjust your gear list for a balanced and lightweight pack.

## Benefits

-   **Efficiency**: Save time and effort by organizing your gear list digitally.
-   **Precision**: Ensure every gram is accounted for, enhancing your hiking efficiency.
-   **Awareness**: Build a sense of lightweight packing and become more mindful of your gear choices.
-   **Preparation**: Be better prepared for your hiking trips with a well-managed pack.

## Join the Everygram Community

Everygram is more than just an app; it's a community of hikers who value the art and science of lightweight packing. Join us, and let’s make every gram count together.

Start your journey with Everygram today and experience the difference that meticulous weight management can make in your hiking adventures.

## Contributing

### Discord Chat Room

[Join our Discord server](https://discord.gg/2tugC7QP) to connect with other Everygram developers and get support from the community.

### Frontend

-   The frontend of Everygram is built using Nuxt + Vue.js

### Backend

-   The backend is using Firebase for authentication, Firestore data storage, and Cloud Functions for serverless logic.

## How to Run the Project in Your Local

To safely develop new features and avoid breaking production, you should set up your own Firebase project and local environment. Follow these steps:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/LeeBoYin/everygram-nuxt.git
    cd everygram-nuxt
    ```

2. **Install Dependencies**

    Install the required dependencies for frontend:

    ```bash
    npm install
    ```

    Install the required dependencies for backend:

    ```bash
    cd functions
    npm install
    ```

3. **Setup Firebase Project**

    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - Create a new project (or use an existing one).
    - Register Web app in the Firebase Console.
    - Enable Authentication (Google signin), Cloud Functions, Firestore and Storage.

4. **Configure Environment Variables**

    Create a `.env` file in the root directory. Add your Firebase environment variables as shown below:

    ```env
    NUXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    NUXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
    NUXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    NUXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
    ```

5. **Add Firebase Admin SDK Credentials**

    Create your Firebase Admin SDK JSON file at:

    ```
    functions/src/everygram-firebase-adminsdk.json
    ```

    You can generate this file from your Firebase project settings under "Service accounts".

6. **Deploy Rules and Functions to Firebase**

    Sign in to your Firebase account:

    ```bash
    npm install -g firebase-tools
    firebase login
    ```

    Select your Firebase project (replace with your actual Project ID).

    ```bash
    firebase use your-project-id
    ```

    Publish rules for Firestore and Storage.

    ```bash
    npm run deploy-rules
    ```

    Deploy Cloud Functions to Firebase, run:

    ```bash
    npm run deploy-functions
    ```

7. **Launch the Nuxt Development Server**

    ```bash
    npm run dev
    ```

    The app will be available at [http://localhost:3000](http://localhost:3000).
