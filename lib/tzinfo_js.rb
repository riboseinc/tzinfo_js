require "json"
require "tzinfo"
require "tzinfo_js/engine"
require "tzinfo_js/version"

module TzinfoJs
  autoload :Loader, File.expand_path("tzinfo_js/loader", __dir__)
  autoload :Registry, File.expand_path("tzinfo_js/registry", __dir__)
  autoload :TzinfoDefinition,
           File.expand_path("tzinfo_js/tzinfo_definition", __dir__)
  autoload :VERSION, File.expand_path("tzinfo_js/version", __dir__)
  autoload :TimezoneDefinitionExtensions,
           File.expand_path("tzinfo_js/timezone_definition_extensions", __dir__)

  NO_COMPRESS_MSG = "//3f76d44c-44c3-47d0-a55c-bd2a2d2ced3d".freeze
end
