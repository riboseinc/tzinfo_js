# coding: utf-8

lib = File.expand_path("lib", __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "tzinfo_js/version"

Gem::Specification.new do |spec|
  spec.name          = "tzinfo_js"
  spec.version       = ::TzinfoJs::VERSION
  spec.authors       = ["Ribose Inc."]
  spec.email         = ["open.source@ribose.com"]

  spec.description   = "Pure-JS TZInfo library"
  spec.summary       = "Pure-JS TZInfo library"
  spec.homepage      = "https://github.com/riboseinc/tzinfo_js"
  spec.license       = "MIT"
  spec.platform      = Gem::Platform::RUBY

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the
  # 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  # if spec.respond_to?(:metadata)
  #   spec.metadata['allowed_push_host'] = "TODO: Set to 'http://mygemserver.com'"
  # else
  #   raise 'RubyGems 2.0 or newer is required to protect against ' \
  #     'public gem pushes.'
  # end

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.required_ruby_version = ">= 2.5.0"

  spec.add_dependency "closure-compiler"
  spec.add_dependency "json"
  spec.add_dependency "railties", "~>4.2"
  spec.add_dependency "tilt"
  spec.add_dependency "tzinfo", "> 1.0.0"
  spec.add_dependency "tzinfo-data", "> 1.0.0"

  spec.add_development_dependency "bundler", "~> 1.15"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "rspec", "~> 3.0"

end
