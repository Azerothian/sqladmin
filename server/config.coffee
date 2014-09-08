module.exports = {
  paths:
    views: "#{__dirname}/views"
    public: "#{__dirname}/public"
    react: "#{__dirname}/../client/react"
  lusca:
    csrf: true
  express:
    port: 6655
    session:
      secret: "sqladmin"
    cookies: null
#      secret: "sqladmins"

}
