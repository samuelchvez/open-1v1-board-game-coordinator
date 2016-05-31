(function() {
  'use strict';

  angular
    .module('othelloLeague')
    .config(config);

  /** @ngInject */
  function config($logProvider) {
    // Enable log
    $logProvider.debugEnabled(true);
  }

})();
