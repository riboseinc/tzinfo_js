module TzinfoJs
  module Loader
    module_function

    # Only install listener when we need to reparse TZInfo files
    def load_tzinfo
      insert_listener_into_tzinfo
      load_tzinfo_definitions
    end

    # Hacks into TZInfo
    def insert_listener_into_tzinfo
      require "tzinfo/timezone_definition"

      TZInfo::TimezoneDefinition.class_eval do
        def self.included(into)
          # puts "HACKED INTO TZINFO!"
          into.extend TzinfoJs::TimezoneDefinitionExtensions
        end
      end
    end

    def load_tzinfo_definitions
      files = Dir[
        File.join(tzinfo_definitions_path, "**", "*.rb")
      ]

      print "[tzinfo_js] loading tzinfo definitions (#{files.length}) from ",
            "tzinfo: v#{tzinfo_version}, tzinfo-data: v#{tzinfo_data_version}"

      files.each_with_index do |path, index|
        load_tzinfo_definition(path)
        print "." if index % 20 == 0
      end

      puts " Done."
    end

    # Path to tzinfo definition rb files
    def tzinfo_definitions_path
      data_path = ["lib", "tzinfo", "data", "definitions"]

      File.join(tzinfo_data_base_path, *data_path)
    end

    def tzinfo_version
      Gem::Specification.find_by_name("tzinfo").version
    end

    def tzinfo_data_version
      Gem::Specification.find_by_name("tzinfo-data").version
    end

    # Path to the directory where README for the gem containing tzinfo
    # definition is placed
    def tzinfo_data_base_path
      data_gem = "tzinfo-data"

      File.expand_path(
        Gem::Specification.find_by_name(data_gem).gem_dir,
      )
    end

    def load_tzinfo_definition(path)
      # puts "[tzinfo_js] loading tzinfo definition from #{path}"

      # Use "load" instead of "require" here because Rails automatically loads
      # the tzinfo "Etc/UTC" definition file before our loading, causing our
      # Registry.linked_map to miss its definition.
      load File.expand_path(path)
    end
  end
end
