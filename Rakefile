$:.unshift File.join(File.dirname(__FILE__), 'lib')
require './lib/tzinfo_js'

load 'lib/tzinfo_js/tasks/tasks.rake'

task :default => 'tzinfo_js:generate'

# desc 'Run specs'
# task :spec => ['spec:ruby', 'spec:js']
#
# desc 'Run Ruby specs'
# RSpec::Core::RakeTask.new('spec:ruby') do |t|
#   t.pattern = './spec/**/*_spec.rb'
# end
