require "erb"
require "tilt"

module TzinfoJs
  class TzinfoDefinition
    attr_reader :name
    attr_accessor :zone_name, :offsets, :sorted_transitions

    class << self
      def new_from_hash(hash_data)
        name                 = hash_data[:name]
        a                    = new(name)
        a.offsets            = hash_data[:offsets]
        a.sorted_transitions = hash_data[:sorted_transitions]

        a
      end
    end

    def initialize(name)
      # puts "[tzinfo_js] TzinfoDefinition init (#{name})"
      @name               = name
      @offsets            = []
      @sorted_transitions = []
    end

    # FOR YIELD BEGIN
    def offset(offset_id, utc_offset, std_offset, symbol)
      @offsets << [offset_id, utc_offset, std_offset, symbol.to_s]
    end

    def transition(_year, _month, offset_id, numerator_or_timestamp, _denominator_or_numerator = nil, denominator = nil)
      offset_index = @offsets.index { |c_id,| c_id == offset_id }
      raise "failed to find offset for #{offset_id.inspect}." unless offset_index

      time = numerator_or_timestamp

      if denominator
        # converting to unix epoch time. Cannot simply convert to Time
        # which will not work on 32-bit-mode ruby for all dates we need
        time = (Rational(numerator_or_timestamp,
                         denominator) - Rational(4881175, 2)) * 86400
        raise time.pretty_inspect unless time.denominator == 1

        time = time.to_i
      end

      @sorted_transitions << [time, offset_index]
    end
    # FOR YIELD END

    def done
      @offsets.collect! { |arr| [arr[1] + arr[2], arr[3]] }
      shift               = 6 * 31 * 24
      prev_time           = -shift
      @sorted_transitions = @sorted_transitions.map do |time, id|
        time      /= 3600.0
        compressed = time - (prev_time + shift)
        prev_time  = time
        [compressed.to_s, id]
      end.flatten.join(" ")
    end

    def data
      {
        offsets:     offsets,
        transitions: sorted_transitions,
      }
    end

    def to_js
      template = Tilt.new(template_path)
      template.render(self)
    end

    def template_path
      File.expand_path("templates/tzinfo_definition.js.erb", __dir__)
    end
  end
end
