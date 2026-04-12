const { withProjectBuildGradle, withAppBuildGradle } = require('expo/config-plugins');

const RAZORPAY_EXCLUDE_BLOCK = `// @generated begin razorpay-exclude-transitive
// checkout AAR already contains these; pulling them again causes :app:checkReleaseDuplicateClasses to fail.
configurations.configureEach {
    exclude group: "com.razorpay", module: "core"
    exclude group: "com.razorpay", module: "standard-core"
}
// @generated end razorpay-exclude-transitive`;

const LEGACY_APP_CHECKOUT = /[\r\n\s]*\/\/ checkout bundles the same classes as transitive standard-core\/core; excluding avoids checkReleaseDuplicateClasses failures\.[\r\n\s]*implementation\("com\.razorpay:checkout:[^"]+"\)\s*\{[^}]*exclude group:\s*"com\.razorpay",\s*module:\s*"standard-core"[^}]*exclude group:\s*"com\.razorpay",\s*module:\s*"core"[^}]*\}/;

const withRazorpay = (config) => {
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

    config.modResults.contents = contents.replace(
      /allprojects\s*\{[\s\S]*?repositories\s*\{/,
      (match) => `${match}
${additions.join('\n')}`
    );

    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Remove legacy duplicate checkout at app level (react-native-razorpay already declares checkout).
    if (LEGACY_APP_CHECKOUT.test(contents)) {
      contents = contents.replace(LEGACY_APP_CHECKOUT, '\n');
    }

    // Drop any prior duplicate app-level checkout block the plugin may have added.
    if (contents.includes('com.razorpay:checkout')) {
      contents = contents.replace(
        /[\r\n\s]*implementation\("com\.razorpay:checkout:[^"]+"\)\s*\{[^}]*exclude group:\s*"com\.razorpay",\s*module:\s*"standard-core"[^}]*exclude group:\s*"com\.razorpay",\s*module:\s*"core"[^}]*\}/g,
        ''
      );
    }

    if (contents.includes('@generated begin razorpay-exclude-transitive')) {
      config.modResults.contents = contents;
      return config;
    }

    config.modResults.contents = contents.replace(
      /dependencies\s*\{/,
      (m) => `${RAZORPAY_EXCLUDE_BLOCK}\n\n${m}`
    );

    return config;
  });

  return config;
};

module.exports = withRazorpay;
