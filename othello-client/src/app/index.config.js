(function() {
  'use strict';

  angular
    .module('othelloClient')
    .config(config);

  /** @ngInject */
  function config($logProvider) {
    // Enable log
    $logProvider.debugEnabled(true);
  }

})();
