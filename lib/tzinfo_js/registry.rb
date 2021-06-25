require "fileutils"
require "pp"

module TzinfoJs
  class Registry
    include Singleton

    attr_reader :loaded, :combined_map
    attr_accessor :tzmap, :linked_map

    def initialize
      @loaded       = false
      @tzmap        = {}
      @linked_map   = {}
      @combined_map = {}
    end

    def mark_loaded(to = true)
      @loaded = to
    end

    def js_export_path
      Engine.root.join("src", "assets", "javascripts", "tzinfo_js",
                       "definitions")
    end

    def js_export_path_setup
      FileUtils.mkdir_p(js_export_path)
    end

    def js_export_path_empty
      FileUtils.rm_rf(File.join(js_export_path, "*"))
    end

    def load_zones
      return false if @loaded

      Loader.load_tzinfo
      all_keys = @linked_map.keys | @tzmap.keys

      # @linked_map may have more than one redirect, we first resolve them all:
      # e.g., Africa/Asmera => Africa/Asmara => Africa/Nairobi
      resolved_link_map = all_keys.reduce({}) do |acc, linked_zone|

        # puts "Resolving zone: #{linked_zone}"
        resolved_zone = linked_zone
        counter       = 1
        while @tzmap[resolved_zone].nil?
          # puts "Resolving zone attempt #{counter}: #{linked_zone}: #{resolved_zone}"
          resolved_zone = @linked_map[resolved_zone]

          # In case a zone cannot be resolved after 10 nils
          counter += 1
          raise "[tzinfo_js] TZInfo timezone (#{linked_zone}) cannot be resolved" if counter > 10
        end

        # puts "Resolved: #{linked_zone}: #{resolved_zone}"
        acc[linked_zone] = resolved_zone
        acc
      end

      resolved_link_map.each do |name, zone_name|
        tzinfo_definition = @tzmap[zone_name]

        unless tzinfo_definition
          raise "[tzinfo_js] Unknown zone #{name.inspect}"
        end

        # Copy out the tzinfo_definition object and tell it that we are a
        # linked_zone: use the child zone's key but the parent zone's
        # definition
        tzinfo_definition           = tzinfo_definition.dup
        tzinfo_definition.zone_name = name
        @combined_map[name]         = tzinfo_definition
      end

      mark_loaded
    end

    # This method will attempt to load from file first, if the zone_map.json
    # file doesn't exist, it loads from tzinfo-data
    def zone_map
      unless @loaded
        load_zone_map_from_file || load_zones
      end

      @combined_map
    end

    def export_js_files
      print "[tzinfo_js] generating tzinfo JS files (#{@combined_map.length})"

      # name is zone name of tzinfo, zone_name is name of actual zone (if
      # tzinfo zone is linked)

      @combined_map.each_with_index do |(name, zone), index|
        filename = File.join(js_export_path, "#{name}.js")
        FileUtils.mkdir_p(File.dirname(filename))
        File.open(filename, "w") do |f|
          # warn "Printing to file #{filename}"
          f << zone.to_js
          f << NO_COMPRESS_MSG
        end
        # print "#{name} "
        print "." if index % 20 == 0

        index += 1
        # Kernel::system "gzip <#{filename} >#{filename+".gz"}"
      end
    end

    def zone_map_export_path
      Engine.root.join("lib", "data", "zone_map.json")
    end

    def export_zone_map
      File.open(zone_map_export_path, "w") do |f|
        f << zone_map.to_json
      end
    end

    def load_zone_map_from_file
      return false if @loaded

      # No file, cannot load
      unless File.file?(zone_map_export_path)
        puts "[tzinfo_js] no zone_map.json file, re-parse TZInfo files"
        return false
      end

      puts "[tzinfo_js] zone_map.json exists, directly load"
      loaded_file = IO.read(zone_map_export_path)
      loaded_map  = JSON.load(loaded_file)

      @combined_map = {}
      loaded_map.each_pair do |name, tzinfo_def|
        @combined_map[name] =
          TzinfoDefinition.new_from_hash(tzinfo_def.symbolize_keys)
      end

      mark_loaded
    end

    # Exports the necessary JS timezone definitions and zone_map.json files
    def export_all
      # Since we are exporting, we ignore the existing zone_map.json file and
      # generate a new one.
      load_zones
      js_export_path_empty
      js_export_path_setup

      export_js_files
      export_zone_map

      puts " Done."
      puts "Please put the following text into the commit message:"
      puts "  Regenerate asset files for { tzinfo: v#{Loader.tzinfo_version}, tzinfo-data: v#{Loader.tzinfo_data_version} }"
    end

    def load_and_export
      export_all
    end
  end
end
