/** @type {CodeceptJS.MainConfig} */
export const config = {
  tests: "./codecept_tests/*_test.js",
  output: "./codecept_output",
  helpers: {
    REST: {
      endpoint: "http://localhost:5000",
      onRequest: (request) => {
        request.headers['Content-Type'] = 'application/json';
      }
    }
  },
  include: {
    I: "./steps_file.js"
  },
  noglobals: true,
  plugins: {},
  name: "KCPM"
};