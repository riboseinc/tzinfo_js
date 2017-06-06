namespace :tzinfo_js do
  desc 'Generate TZInfo JS definition files and zone_map.json file'
  task :generate do
    TzinfoJs::Registry.instance.load_and_export
  end
end
