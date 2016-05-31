(function() {
  'use strict';

  angular
    .module('othelloClient',
      [
        'ngAnimate',
        'ngTouch',
        'restangular',
        'ui.router',
        'btford.socket-io',
        'weed'
      ]);

})();
