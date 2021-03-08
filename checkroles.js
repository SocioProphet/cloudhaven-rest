function hasRequiredRole( userRoles, requiredRoles) {
  var userRoleMap = userRoles.reduce(function(mp, role){
      mp[role] = true;
      return mp;
  },{});
  return requiredRoles.find((role)=>userRoleMap[role]);
}
export function checkRoleWithPassport(authData, passport, sourceTag ){
    var func = function(req, res, next){
      passport.authenticate('jwt', function(err, user, info){
        if(err) { return next(err); }
          if(!user) {
            if (info.name === "TokenExpiredError") {
              return res.status(401).json({ message: "Your token has expired. Please generate a new one" });
          } else {
              return res.status(401).json({ message: info.message });
          }
        }
        if (authData && authData.authData) authData.authData.user = user;
        req.userId = user._id;
        if(!authData || !authData.roles || authData.roles.length == 0) {
            next()
          } else if(authData.roles[0]=='ANY' || hasRequiredRole( user.roles, authData.roles)) {
            next()
          } else {
            var st = sourceTag;
            res.status(403).send('forbidden')
          }
      })(req, res, next)
    }
    return func;
  }
