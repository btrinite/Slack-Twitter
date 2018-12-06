module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps : [
  
      // First application
      {
        name      : 'slack2twitter',
        script    : 'src/slack-twitter.js',
        restart_delay : "4000",
        watch: ['src'],
        ignore_watch : ['node_modules'],
        watch_options: {
           followSymlinks: 'false'
        },
        env: {
          COMMON_VARIABLE: 'true'
        },
        env_production : {
        }
      },
    ],
  };