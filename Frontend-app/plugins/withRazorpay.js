const { withProjectBuildGradle, withAppBuildGradle } = require('expo/config-plugins');

const withRazorpay = (config) => {
  // Modify project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const hasJitpack = contents.includes('maven { url "https://jitpack.io" }');
    const hasRazorpayRepo = contents.includes('maven { url "https://maven.razorpay.com" }');

    if (hasJitpack && hasRazorpayRepo) {
      return config;
    }

    const additions = [];
    if (!hasJitpack) {
      additions.push('        maven { url "https://jitpack.io" }');
    }
    if (!hasRazorpayRepo) {
      additions.push('        maven { url "https://maven.razorpay.com" }');
    }

    // Add repositories required for Razorpay
    config.modResults.contents = contents.replace(
      /allprojects\s*\{[\s\S]*?repositories\s*\{/,
      (match) => `${match}
${additions.join('\n')}`
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
    implementation "com.razorpay:checkout:1.6.40"`
    );

    return config;
  });

  return config;
};

module.exports = withRazorpay;
