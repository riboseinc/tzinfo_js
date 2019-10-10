require "rails"

module TzinfoJs
  class Engine < ::Rails::Engine
    rake_tasks do
      load "tzinfo_js/tasks/tasks.rake"
    end

    initializer "tzinfo_js.set_precompile_path" do |app|
      app.config.assets.precompile << /^tzinfo_js/
    end

    initializer "tzinfo_js.load_timezone_definitions" do
      Registry.instance.zone_map
    end
  end
end
