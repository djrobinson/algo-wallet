const asyncMiddleware = (fn:any) => {
  (req:any, res:any, next:any) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };
}

module.exports = asyncMiddleware;