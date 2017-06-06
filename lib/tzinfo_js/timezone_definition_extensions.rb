# Supplement TZInfo's TimezoneDefinition DSL, adding our own listener
module TzinfoJs
  module TimezoneDefinitionExtensions

    # FOR YIELD BEGIN

    def timezone(name)
      definer = TzinfoDefinition.new(name)
      yield definer
      definer.done
      TzinfoJs::Registry.instance.tzmap[name] = definer
      super
    end

    def linked_timezone(name, real_name)
      TzinfoJs::Registry.instance.linked_map[name] = real_name
      super
    end

    # FOR YIELD END

  end
end


