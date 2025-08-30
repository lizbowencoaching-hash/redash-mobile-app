# iOS App Setup Instructions

## Prerequisites
Before you can build your iOS app, you'll need:

1. **Mac computer** - iOS development requires macOS
2. **Xcode** - Download from the Mac App Store (free)
3. **Apple Developer Account** - Required for App Store distribution ($99/year)

## Step-by-Step Setup

### 1. Build and Add iOS Platform
```bash
# Build your React app and sync with Capacitor
npm run build:mobile

# Add iOS platform (run this only once)
npx cap add ios
```

### 2. Open in Xcode
```bash
# This will open your project in Xcode
npm run ios
```

### 3. Configure in Xcode
When Xcode opens:

1. **Select your development team**:
   - Click on the project name in the left sidebar
   - Under "Signing & Capabilities", select your Apple Developer team
   - Xcode will automatically generate a bundle identifier

2. **Configure app settings**:
   - App name: REDash
   - Bundle ID: com.redash.app (or your custom domain)
   - Version: 1.0.0

3. **Test on simulator**:
   - Select an iOS simulator from the device dropdown
   - Click the "Play" button to build and run

### 4. Test on Physical Device
1. Connect your iPhone via USB
2. Select your device from the dropdown
3. Click "Play" to install and run on your device

### 5. Build for App Store
```bash
# Build optimized version for distribution
npm run ios:build
```

Then in Xcode:
1. Select "Any iOS Device" from the device dropdown
2. Go to Product → Archive
3. Follow the upload process to App Store Connect

## Important Notes

- **First build takes time**: The initial iOS build can take 10-15 minutes
- **Simulator vs Device**: Test on both simulator and real device
- **App Store Review**: Apple reviews all apps before they go live (1-7 days)
- **Updates**: When you update your React code, run `npm run build:mobile` to sync changes

## Troubleshooting

If you encounter issues:
1. Clean build folder: Product → Clean Build Folder in Xcode
2. Reset Capacitor: `npx cap sync ios --force`
3. Check Capacitor docs: https://capacitorjs.com/docs/ios

## Next Steps After Setup

1. Test all features work on mobile
2. Add app icons and splash screens
3. Configure push notifications (if needed)
4. Submit to App Store for review

## 📱 Testing Your iOS App

1. **iOS Simulator**: Test in Xcode's built-in simulator
2. **Physical Device**: Connect your iPhone via USB for real device testing
3. **TestFlight**: Use Apple's TestFlight for beta testing with others

## 🔔 Push Notifications Setup

Your app now includes monthly push notification reminders! To enable them:

1. **In Xcode**: 
   - Select your project in the navigator
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability" and add "Push Notifications"
   - Also add "Background Modes" and check "Background processing"

2. **Apple Developer Account**:
   - You'll need an Apple Developer account ($99/year) to:
     - Test on physical devices
     - Enable push notifications
     - Submit to App Store

3. **Notification Features**:
   - Monthly reminders on the 1st of each month at 9 AM
   - Users can enable/disable via the bell icon in the app
   - Notifications work even when app is closed

## 🚀 App Store Submission

When ready to publish:

1. **Create App Store Connect Record**: Set up your app listing
2. **Upload Build**: Use Xcode's Archive feature to upload your app
3. **Fill App Information**: Add descriptions, screenshots, and metadata
4. **Submit for Review**: Apple typically reviews apps within 24-48 hours
5. **Release**: Once approved, your app will be available on the App Store!

## 📋 App Store Requirements

- **Privacy Policy**: Required for apps that collect user data
- **App Description**: Clear description of your real estate tracking features
- **Screenshots**: iPhone screenshots showing key features
- **App Icon**: 1024x1024 pixel icon for the App Store

## 🔧 Troubleshooting

- **Build Errors**: Make sure you have the latest Xcode version
- **Simulator Issues**: Try resetting the iOS Simulator
- **Device Testing**: Ensure your Apple ID is added to the development team
- **Notification Issues**: Check that capabilities are properly configured in Xcode

## 📞 Need Help?

If you run into issues:
1. Check the [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
2. Review Apple's [iOS Development Guide](https://developer.apple.com/ios/)
3. Join the [Capacitor Community Discord](https://discord.gg/UPYYRhtyzp)
4. For push notifications: [Capacitor Push Notifications Guide](https://capacitorjs.com/docs/apis/push-notifications)

Your REDash app is now ready to become a native iOS app! 🎉
