const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const withRazorpay = (config) => {
  // Modify project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('maven { url "https://jitpack.io" }')) {
      return config;
    }

    // Add JitPack repository for Razorpay
    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*\{[\s\S]*?repositories\s*\{/,
      (match) => `${match}
        maven { url "https://jitpack.io" }`
    );

    return config;
  });

  // Modify app-level build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('implementation "com.razorpay:checkout"')) {
      return config;
    }

    // Add Razorpay dependency
    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*\{/,
      (match) => `${match}
    implementation "com.razorpay:checkout:1.6.33"`
    );

    return config;
  });

  return config;
};

module.exports = withRazorpay;
