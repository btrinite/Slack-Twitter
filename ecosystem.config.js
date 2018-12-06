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
  
    /**
     * Deployment section
     * http://pm2.keymetrics.io/docs/usage/deployment/
     */
    deploy : {
      production : {
        user : 'node',
        host : '172.31.21.30',
        ref  : 'origin/master',
        repo : 'git@github.com:btrinite/Slack-Twitter.git',
        path : '/home/ec2-user/Slack-Twitter',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
      },
      dev : {
        user : 'node',
        host : '172.31.21.30',
        ref  : 'origin/master',
        repo : 'git@github.com:btrinite/Slack-Twitter.git',
        path : '/home/ec2-user/Slack-Twitter',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
        env  : {
          NODE_ENV: 'dev'
        }
      }
    }
  };