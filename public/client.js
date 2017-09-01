(function() {
  var Rescues = {

    index: function() {
      $('form[data-action=search]').submit(function(e) {
        e.preventDefault();
        console.log("submit");
        var query = $(this).find('input[name=search_query]').val();

        Rescues.search(query);
      });

      $(document).on("click", ".master-button", function() {
        var id = $(this).attr('id').split("-")[1];
        $.post("/rescues/master/" + id, function(data) {
          if(data === "OK") {
            console.log(data);
            location.reload();
            //Rescues.search($("#search_query").val());
          }
        });
      });

      $(document).on("click", ".duplicate-button", function() {
        var duplicateId = $(this).attr('id').split("-")[1];
        var masterId = $(this).prev().val();
        $.post("/rescues/duplicate/" + duplicateId + "/master/" + masterId, function(data) {
          if(data === "OK") {
            console.log(data);
            location.reload();
            //Rescues.search($("#search_query").val());
          }
        });
      });

      $.get("/rescues/json")
        .then(function(resp) {
          this._rescues = resp;

          var fuseOptions = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
              "streetAddress",
              "locationComments"
            ]
          };

          Rescues._fuse = new Fuse(resp, fuseOptions);
          Rescues.UI.showSearch();
        })
        .fail(function(err) {
          console.err(err);
        });
    },
    search: function(query) {
      var searchResults = this._fuse.search(query);

      if(searchResults.length) {
        this.UI.renderResultsHeader(searchResults[0]);
        this.UI.renderResults(searchResults);
      } else {
        this.UI.renderNoneFound();
      }
    },

    viewSingle: function(incidentNumber) {

    }

    UI: {
      _isValidAttr: function(attr) {
        return (attr != "_id") && (attr != "__v");
      },
      showSearch: function() {
        $('#search .loading').hide();
        $('#search .search-bar').show();
      },
      renderResultsHeader: function(result) {
        var $thead = $('#search_results table thead');
        $thead.html("<th></th>");

        var _isValidAttr = this._isValidAttr;

        var attrOrder = [];
        this._attrOrder = attrOrder;

        _.chain(result).keys().each(function(k) {
          if(_isValidAttr(k)) {
            attrOrder.push(k);
            $thead.append("<th>" + k + "</th>");
          }
        }).value();
      },
      renderResults: function(results) {
        var $tbody = $("#search_results tbody");
        $tbody.html("");

        var renderResult = this.renderResult.bind(this);

        _.each(results, function(result) {
          $tbody.append(renderResult(result));
        });

        $('#none_found').hide();
        $('#search_results').show();
      },
      renderResult: function(result) {
        var _isValidAttr = this._isValidAttr.bind(this);

        var cols = _.map(this._attrOrder, function(attr) {
          return "<td>" + result[attr] + "</td>";
        });

        var buttons = "<td><button class='master-button' id='master-"
         + result["incidentNumber"]
         + "'>Master</button><br>Master Inc Num:<br><div><input type='text' name='master-number'/><button class='duplicate-button' id='duplicate-"
         + result["incidentNumber"]
         + "'>Duplicate</button></div>";

        return $("<tr>" + buttons + cols.join("") + "</tr>");
      },
      renderNoneFound: function() {
        $('#search_results').hide();
        $('#none_found').show();
      }
    }
  };

  function getAllUrlParams(url) {

    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

    // we'll store the parameters here
    var obj = {};

    // if query string exists
    if (queryString) {

      // stuff after # is not part of query string, so get rid of it
      queryString = queryString.split('#')[0];

      // split our query string into its component parts
      var arr = queryString.split('&');

      for (var i=0; i<arr.length; i++) {
        // separate the keys and the values
        var a = arr[i].split('=');

        // in case params look like: list[]=thing1&list[]=thing2
        var paramNum = undefined;
        var paramName = a[0].replace(/\[\d*\]/, function(v) {
          paramNum = v.slice(1,-1);
          return '';
        });

        // set parameter value (use 'true' if empty)
        var paramValue = typeof(a[1])==='undefined' ? true : a[1];

        // (optional) keep case consistent
        paramName = paramName.toLowerCase();
        paramValue = paramValue.toLowerCase();

        // if parameter name already exists
        if (obj[paramName]) {
          // convert value to array (if still string)
          if (typeof obj[paramName] === 'string') {
            obj[paramName] = [obj[paramName]];
          }
          // if no array index number specified...
          if (typeof paramNum === 'undefined') {
            // put the value on the end of the array
            obj[paramName].push(paramValue);
          }
          // if array index number specified...
          else {
            // put the value at that index number
            obj[paramName][paramNum] = paramValue;
          }
        }
        // if param name doesn't exist yet, set it
        else {
          obj[paramName] = paramValue;
        }
      }
    }

    return obj;
  }

  window.Rescues = Rescues;
})();
