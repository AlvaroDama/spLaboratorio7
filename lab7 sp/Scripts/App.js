'use strict';

var context;
var sugerenciasList;
var sugerencias;
var sugerenciaActual;

var init = function () {
    context = SP.ClientContext.get_current();
    getSugerencias();
};

var getSugerencias = function() {
    sugerenciasList = context.get_web().get_lists().getByTitle('ListaSugerencias');
    sugerencias = sugerenciasList.getItems(new SP.CamlQuery());
    context.load(sugerencias);
    context.executeQueryAsync(onGetSugerenciasSuccess, onFail);
};

var mostrarSugerencia = function (id) {
    sugerenciaActual = sugerenciasList.getItemById(id);
    context.load(sugerenciaActual);
    context.executeQueryAsync(onDisplaySugerenciaSuccess, onFail);
};

var crearSugerencia = function() {
    var itemCreateInfo = SP.ListItemCreationInformation();
    sugerenciaActual = sugerenciasList.addItem(itemCreateInfo);
    sugerenciaActual.set_item('Asunto', $('#asunto-input').val().toString());
    sugerenciaActual.set_item('Sugerencia', $('#sugerencia-input').val().toString());
    sugerenciaActual.update();
    context.load(sugerenciaActual);
    context.executeQueryAsync(onCreateSuccess, onFail);
};

var contarVotos = function() {
    var votos = 0;
    var url = _spPageContextInfo.webServerRelativeUrl +
        "/_api/web/lists/getByTitle('ListaSugerenciasLookups')/items";

    $.ajax({
        url: url + "?filter=SugerenciaLookup eq" + sugerenciaActual.get_item('ID'),
        type: "GET",
        headers: { 'accept': 'application/json; odata=verbose' },
        success:function(data) {
            $.each(data.d.results, function(i, result) {
                if (result.Positivo)
                    votos++;
                else
                    votos--;
            });
            $('#votos-count').html(votos);
        },
        error: function(err) {
            alert(JSON.stringify(err));
        }
    });
};

var guardarVoto = function (pos) {
    var url = _spPageContextInfo.webServerRelativeUrl +
        "/_api/web/lists/getByTitle('ListaSugerenciasLookups')/items";

    var formDigest = $('#__REQUESTDIGEST').val();

    $.ajax({
        url: url,
        type: 'POST',
        data: JSON.stringify({
            '__metadata': { 'type': 'SP.Data.ListaSugerenciasLookupsListItem' },
            'Positivo': pos,
            'SugerenciaLookupId': sugerenciaActual.get_item('ID')
        }),
        headers: {
            'accept': 'application/json; odata=verbose',
            'content-type': 'application/json; odata=verbose',
            'X-RequestDigest': formDigest
        },
        success:function() {
            alert("Gracias por votar");
            contarVotos();
        },
        error:function(err) {
            alert(JSON.stringify(err));
        }
    });
}

var onGetSugerenciasSuccess = function () {
    var htmlToRender = [];
    var sugerenciasEnumerator = sugerencias.getEnumerator();

    while (sugerenciasEnumerator.moveNext()) {
        var item = sugerenciasEnumerator.get_current();

        htmlToRender.push('<a onclick="mostrarSugerencia(');
        htmlToRender.push(item.get_item('ID'));
        htmlToRender.push(')">');
        htmlToRender.push(item.get_item('Asunto'));
        htmlToRender.push('</a><br />');
    }
    $('#sugerencias-list').html(htmlToRender.join(''));
};

var onDisplaySugerenciaSuccess = function() {
    $('#item-display').fadeOut('fast', function() {
        $('#item-display-asunto').html(sugerenciaActual.get_item('Asunto'));
        $('#item-display-sugerencia').html(sugerenciaActual.get_item('Sugerencia'));
        contarVotos();
        $('#item-display').fadeIn('fast');
    });
};

var onCreateSuccess = function() {
    getSugerencias();
};

var onFail = function (sender, args) {
    alert("Error: " + args.get_message());
};

$(document).ready(function() {
    ExecuteOrDelayUntilScriptLoaded(function() {
        init();
    }, "sp.js");
});

