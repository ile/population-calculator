
(function (global) {
    var graph,
        data,
        data2, // for display
        i,
        uri = new Uri(),
        growth_rate = 0,
        vars_query = uri.get(),
        vars = {
            human_age: 80,
        	title: '',
            birth_rate: 4,
            birth_age: 21,
            immigration: 1000,
            start_pop: 60000,
            timespan: 200,
            start_year: (new Date()).getFullYear(),
            pyramid: 'flat'
        }

    if (vars_query && typeof(vars_query) === 'object') {
    	for (i in vars_query) {
    		vars[i] = isNumber(vars_query[i])? parseFloat(vars_query[i]): vars_query[i];
    	}
    }

    // set some event handlers
    global.d3.selectAll('.vars').on('change', input_change);
    global.d3.selectAll('#title').on('keypress', title_keyup);
    global.d3.selectAll('label span').on('click', get_value_manually);
    show_storage();
    calculate();
    set_intial_values();
    draw();

    function get_value_manually(e) {
        var id,
            result,
            el = d3.event.srcElement;

        if (el) {
            id = el.getAttribute('data-for');
            result = window.prompt('New value', vars[id]);
            if (result !== null) {
                vars_changed(id, result);
            }
        }
    }

    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function print_growth_rate() {
        growth_rate = (Math.pow(vars.birth_rate / 2, 1.0 / (vars.birth_age + vars.birth_rate)) - 1) * 100;
        global.d3.select('#growth_rate').html(Math.round(growth_rate * 100) / 100 + ' %')
    }

    function sum(data) {
        var sum = data.reduce(function (previousValue, currentValue) {
            return currentValue + previousValue;
        });

        return sum;
    }

    function set_intial_values() {
        var el, el2, i;

        print_growth_rate();
        for (i in vars) {
            el = global.d3.select('#' + i);
            el2 = global.d3.select('#' + i + '_v');
            if (el) {
                if (i === 'pyramid') {
                    el.property('value', vars[i]);
                }
                else {
                    el.attr('value', vars[i]);
                }
                el2.html(global.Rickshaw.Fixtures.Number.formatKMBT(vars[i]) || 0);
            }
        }
    }

    function calculate() {
        var i, initial, immigration_yearly;

        function initial_population(n, pyramid) {
            var i, p, d = [],
                pyramids = {
                    // population pyramid: ages 10-40 emphasized
                    // youth: function(n, i) { return i < 10? n * 0.005 / vars.human_age : (i < 20 ? n * 0.025 / vars.human_age: (i < 30 ? n * 0.03 / vars.human_age : (i < 40 ? n * 0.022 / vars.human_age: (n * 0.005 / vars.human_age)))); },
                    youth: function(n, i) { return i >= 10 && i < 40? Math.round((n / 2) / 30): Math.floor((n / 2) / (vars.human_age - 30))  },

                    // flat population pyramid
                    flat: function(n) { return Math.round(n / vars.human_age); },

                    //testing
                    all0: function(n, i) { return i < 1? n: 0; }
                }

            pyramid = pyramid || 'flat';

            for (i = 0; i < vars.human_age - 1; i++) {
                d[i] = pyramids[pyramid](n, i);
            }

            return d;
        }

        function aging(n) {
            var i;

            for (i = 1; i < vars.human_age; i++) {
                data[n]['population'][i] = data[n - 1]['population'][i - 1];
            }
        }

        function birth(n) {
            var i,
                how_many_babies,
                upper_year = vars.birth_age + Math.ceil(vars.birth_rate),
                remainder = vars.birth_rate - Math.floor(vars.birth_rate) || 1;

            // half of the population (women) is giving birth to 'how_many_babies' babies per year
            // how_many_babies is normally 1 but the last baby can be [0..1]
            for (i = vars.birth_age, j = Math.ceil(vars.birth_rate); i < upper_year; i++, j--) {
                how_many_babies = j > 1 ? 1 : remainder;

                data[n]['population'][0] += Math.floor((data[n]['population'][i] / 2) * how_many_babies);
            }
        }

        function immigration(n) {
            var i;

            for (i = 1; i < vars.human_age - 1; i++) {
                data[n]['population'][i] += immigration_yearly[i];
            }
        }

        initial = initial_population(vars.start_pop, vars.pyramid);

        data = [{
            year: vars.start_year,
            population: initial,
            total: sum(initial)
        }]

        console.log(data);

        data2 = [{
            x: Math.ceil(new Date(vars.start_year, 0, 2).getTime() / 1000),
            y: data[0]['total']
        }];

        immigration_yearly = initial_population(vars.immigration, vars.pyramid);

        for (i = 1; i < vars.timespan; i++) {
            data[i] = {
                year: vars.start_year + i,
                population: [0],
                total: 0
            }
            aging(i);
            birth(i);
            immigration(i);
            data[i]['total'] = sum(data[i]['population']);
            data2[i] = {
                x: Math.ceil(new Date(data[i]['year'], 0, 2).getTime() / 1000),
                y: data[i]['total']
            }
        }
    }

    function draw() {
        var width = document.querySelector("#chart").offsetWidth,
            height = 550,
            hoverDetail,
            time,
            years,
            x_axis,
            y_axis;

        graph = new global.Rickshaw.Graph({
            element: document.querySelector("#chart"),
            width: width,
            height: height,
            renderer: 'area',
            stroke: true,
            series: [{
                data: data2,
                color: '#cae2f7'
            }]
        });

        hoverDetail = new global.Rickshaw.Graph.HoverDetail({
            graph: graph,
            formatter: function (series, x, y, formattedX, formattedY, d) {
                return formattedX + '<br>' + 'population: ' + formattedY;
            },
            yFormatter: function (y, x) {
                return global.Rickshaw.Fixtures.Number.formatKMBT(y)
            },
            xFormatter: function (ts) {
                var y = new Date(ts * 1000).getFullYear();
                return 'year: ' + y + '<br>from now: ' + (y - new Date().getFullYear() + ' years');
            }
        });

        time = new global.Rickshaw.Fixtures.Time();
        years = time.unit('year');
        x_axis = new global.Rickshaw.Graph.Axis.Time({
            graph: graph
        });

        y_axis = new global.Rickshaw.Graph.Axis.Y({
            graph: graph,
            orientation: 'left',
            tickFormat: global.Rickshaw.Fixtures.Number.formatKMBT,
            element: document.getElementById('y_axis'),
        });

        graph.render();
    }

    function update_graph() {
        graph.series[0].data = data2;
        graph.update();
    }

    function add_to_store(input) {
        if (global.localStorage && JSON && vars['title']) {
            global.localStorage.setItem(vars['title'], JSON.stringify(vars));
            if (input === 'title') {
                message('graph saved');
            }
        }
    }

    function del_from_store() {
        if (global.localStorage && JSON) {
            global.localStorage.removeItem(d3.select(this.previousSibling).datum());
            global.d3.select(d3.select(this.parentNode).remove())
        }
    }

    function show_storage() {
        var key, obj;

        if (global.localStorage && JSON) {
            global.d3.select('#storage').html(null);
            for (var key in localStorage) {
                obj = JSON.parse(localStorage.getItem(key));
                if (obj && obj.title) {
                    global.d3.select('#storage')
                        .append('li')
                        .append('a')
                        .attr('href', '/population-calculator/?' + Math.floor(Math.random() * 1000) + '#'+uri.toString(obj))
                        .html(obj.title)
                        .datum(obj.title);
                }

            }
            global.d3.selectAll('#storage li').append('span').html('delete').on('click', del_from_store)
        }
    }

    function title_keyup() {
        if (d3.event.keyCode === 13) {
            this.blur();
        }
    }

    function vars_changed(name, value) {
        vars[name] = isNumber(value)? parseFloat(value): value;
        global.d3.select('#' + name + '_v').html(global.Rickshaw.Fixtures.Number.formatKMBT(parseFloat(value)) || 0);
        uri.set(vars);
        calculate();
        add_to_store(name);
        show_storage();
        print_growth_rate()
        update_graph();
    }

    function input_change(el) {
        if (typeof (vars[this.id]) !== 'undefined') {
            vars_changed(this.id, this.value);
        }
    }

    var timeout;

    function message(str) {
        if (global.d3.select('#message').empty())
        {
            global.d3.select('body').append('div').attr('id', 'message')
        }
        var msg = global.d3.select('#message').html(str).attr('class', 'show')
        global.clearTimeout(timeout);
        timeout = global.setTimeout(function() { msg.attr('class', ''); }, 4000)
    }

}(this));
