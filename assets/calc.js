
(function (global) {
    var graph,
        data,
        data2,
        i,
        HUMAN_AGE = 80,
        uri = new Uri(),
        vars_query = uri.get(),
        vars = {
            birth_rate: 4,
            growth_rate: 0,
            birth_age: 21,
            immigration: 5000,
            start_pop: 60000,
            timespan: 160,
            start_year: 2013
        }

    var PopCalc = global.PopCalc = global.PopCalc || {};

    if (vars_query && typeof(vars_query) === 'object') {
    	for (i in vars_query) {
    		vars[i] = parseFloat(vars_query[i]);
    	}
    }

    calculate();
    set_intial_values();
    draw();

    function print_growth() {
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

        print_growth();
        for (i in vars) {
            el = global.d3.select('#' + i)
            el2 = global.d3.select('#' + i + '_v')
            if (el) {
                el.attr('value', vars[i])
                el2.html(global.Rickshaw.Fixtures.Number.formatKMBT(vars[i]))
            }
        }
    }

    function calculate() {
        var i, initial, immigration_yearly;

        function initial_population(n) {
            var i, p, d = [];

            for (i = 0; i < HUMAN_AGE - 1; i++) {
                // skewed population pyramid
                // d[i] = i < 10? n * 0.005 : (i < 20 ? n * 0.025 : (i < 30 ? n * 0.03 : (i < 40 ? n * 0.022 : (n * 0.005))));;

                // flat population pyramid
                d[i] = Math.ceil(n * 0.012651);
            }

            return d;
        }

        function aging(n) {
            var i;

            for (i = 1; i < HUMAN_AGE; i++) {
                data[n]['population'][i] = data[n - 1]['population'][i - 1];
            }
        }

        function birth(n) {
            var i,
                how_many_babies,
                upper_year = vars.birth_age + Math.ceil(vars.birth_rate),
                remainder = vars.birth_rate - Math.floor(vars.birth_rate) || 1;

            for (i = vars.birth_age, j = Math.ceil(vars.birth_rate); i < upper_year; i++, j--) {
                how_many_babies = j > 1 ? 1 : remainder;

                // half of the population (women) is giving birth to 'how_many_babies' babies
                // how_many_babies is normally 1 but the last baby can be [0..1]
                data[n]['population'][0] += Math.floor((data[n]['population'][i] / 2) * how_many_babies);
            }
        }

        function immigration(n) {
            var i;

            for (i = 1; i < HUMAN_AGE - 1; i++) {
                data[n]['population'][i] += immigration_yearly[i];
            }
        }

        initial = initial_population(vars.start_pop);
        data = [{
            year: vars.start_year,
            population: initial,
            total: sum(initial)
        }]
        data2 = [{
            x: Math.ceil(new Date(vars.start_year, 0, 2).getTime() / 1000),
            y: data[0]['total']
        }];
        immigration_yearly = initial_population(vars.immigration);

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

        growth_rate = (Math.pow(vars.birth_rate / 2, 1 / (vars.birth_age + Math.ceil(vars.birth_rate))) - 1) * 100;
    }

    function draw() {
        var width = 960,
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

    PopCalc.update = function update(el) {
        if (typeof (vars[el.id]) !== 'undefined') {
            global.d3.select('#' + el.id + '_v').html(global.Rickshaw.Fixtures.Number.formatKMBT(parseFloat(el.value)) || 0)
            print_growth()
            vars[el.id] = parseFloat(el.value);
            uri.set(vars);
            calculate();
            update_graph();
        }
    }

}(this));
