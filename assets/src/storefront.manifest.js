module.exports = {
  
  'http.storefront.pages.cart.request.before': {
      actionName: 'http.storefront.pages.cart.request.before',
      customFunction: require('./domains/storefront/http.storefront.pages.cart.request.before')
  },
  
  'http.storefront.pages.cart.request.after': {
      actionName: 'http.storefront.pages.cart.request.after',
      customFunction: require('./domains/storefront/http.storefront.pages.cart.request.after')
  },
  
  'http.storefront.pages.checkout.request.before': {
      actionName: 'http.storefront.pages.checkout.request.before',
      customFunction: require('./domains/storefront/http.storefront.pages.checkout.request.before')
  },
  
  'http.storefront.pages.checkout.request.after': {
      actionName: 'http.storefront.pages.checkout.request.after',
      customFunction: require('./domains/storefront/http.storefront.pages.checkout.request.after')
  }
};
