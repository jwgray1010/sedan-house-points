// reportWebVitals.js - Web Vitals reporting for performance monitoring

// This function allows you to measure and report web vitals.
// Pass a function (e.g., log or analytics callback) as onPerfEntry.
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

// Suggestions:
// - Use typeof onPerfEntry === 'function' for clarity.
// - Add a comment explaining usage for future maintainers.
// - To actually log results, pass a function in src/index.js, e.g.:
//     reportWebVitals(console.log);
// - For production, send results to an analytics endpoint instead of console.log.
