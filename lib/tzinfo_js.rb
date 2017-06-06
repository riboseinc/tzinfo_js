require 'rails'
require 'json'
require 'tzinfo'
require File.expand_path('../tzinfo_js/engine', __FILE__)

module TzinfoJs

  autoload :Loader, File.expand_path('../tzinfo_js/loader', __FILE__)
  autoload :Registry, File.expand_path('../tzinfo_js/registry', __FILE__)
  autoload :TzinfoDefinition, File.expand_path('../tzinfo_js/tzinfo_definition', __FILE__)
  autoload :VERSION, File.expand_path('../tzinfo_js/version', __FILE__)
  autoload :TimezoneDefinitionExtensions, File.expand_path('../tzinfo_js/timezone_definition_extensions', __FILE__)

  NO_COMPRESS_MSG = '//3f76d44c-44c3-47d0-a55c-bd2a2d2ced3d'

end
