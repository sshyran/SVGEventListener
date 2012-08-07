// SVGEventListener.js
// Version - 0.1-pre
//
// by MAD - @madsgraphics - ecrire[at]madsgraphics.com
//
// https://github.com/madsgraphics/SVGEventListener.js/
//
// Version: 0.1-pre
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
//
( function ( window, doc, element ) {

  'use strict';

  var addEventListener_legacy   = element.prototype.addEventListener,
      svg                       = doc.createElementNS( 'http://www.w3.org/2000/svg', 'svg' ),
      // helper functions
      isString                  = function ( s ) {
        return typeof s == "string";
      },
      isUndefined               = function ( obj ) {
        return typeof obj === undefined;
      },
      isFunction                = function ( fn ) {
        return toString.call( fn ) == "[object Function]";
      },
      // Inspired by: http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
      isEventSupported          = function ( eventName ) {
        eventName = 'on' + eventName;
        // Check if the event attribute exists on el
        var isSupported = ( eventName in svg );
        // if not, try to set an event attribute with a falsy method
        if ( !isSupported ) {
          svg.setAttribute( eventName, 'return;' );
          isSupported = isFunction( svg[eventName] );
        }

        return isSupported;
      };

  // Clocker.js
  // Convert a legal clock string value (in SMIL definition) to milliseconds
  //
  // Originaly released here:
  function clocker( time ) {
    var i,
        times = time.split( ':' );

    // Format without ':' ?
    if ( times.length == 1 ) {
      // Time already given in milliseconds (250ms)
      if (( i = times[0].lastIndexOf('ms') ) != -1 ) {
        return Number( times[0].substring(0, i) );
      }
      // Time given in seconds (2s)
      else if (( i = times[0].lastIndexOf('s') ) != -1 ) {
        return times[0].substring(0, i) * 1000;
      }
      // Time without unity. Assume in seconds,
      // with potentially decimals (2.05 == 2050ms)
      else {
        return times[0]*1000;
      }
    }
    // Legacy clock value with ':' separator
    else {
      // Reverse order to iterate from seconds to hours
      times.reverse();
      // Init time
      time = 0;
      for ( var t in times ) {
        // Value * 60^t (hours / minutes to seconds) * 1000 (s to ms)
        time += times[t]*Math.pow(60, t)*1000;
      }

      return Number(time);
    }
  }

  /***
   * Event Listener
   ***/

  // Custom Event listener
  // Implements Observer pattern
  //
  // inspired by: http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/

  // Create custom listener object with private property to store listeners
  function EventListener() {
    this._listeners = {};
  }

  // Extends it to add and fire events
  EventListener.prototype = {
    constructor : EventListener,
    // add new event to listeners
    add: function addListener( type, listener ) {
      // if there is no triggers already defined for this events,
      // init an a-empty array
      if ( typeof this._listeners[type] == 'undefined' ) {
        this._listeners[type] = [];
      }
      // add trigger to the event
      this._listeners[type].push( listener );
    },
    // fire the event
    fire: function fireListeners( event ) {
      // if called only by event name (useful), build a correct object
      if ( typeof event == 'string' ) {
        event = {type: event};
      }
      // set target if unavailable
      if ( !event.target ) {
        event.target = this;
      }
      // if there is no event given, throw an error
      if ( !event.type ) {
        throw new Error( "Event object missing 'type' property." );
      }
      // If the type has associated triggers, then launch them
      if ( this._listeners[event.type] instanceof Array ) {
        var listeners = this._listeners[event.type];
        for ( var l in listeners ) {
          listeners[l].call( this, event );
        }
      }
    }
  };

  var eventListener   = new EventListener();

  // Overwrite Element.addEventListener method for transparency fallback
  //
  // Inpired by: http://stackoverflow.com/questions/7220515/extending-node-addeventlistener-method-with-the-same-name#7220628
  element.prototype.addEventListener = function( type, listener, useCapture ) {
    var timeout;
    /** CASE 1 : endEvent **/
    // check event name and support for the event
    if ( type == 'endEvent' && !isEventSupported(type.substring(0, type.indexOf('Event'))) ) {
      // register listener to the events
      eventListener.add( type, listener );
      // set a timer based on begin and dur attributes
      timeout = clocker( this.getAttribute('begin') ) + clocker( this.getAttribute('dur') );
      window.setTimeout( function() { eventListener.fire(type); }, timeout );
    }

    // call the original method for fallback
    return addEventListener_legacy.call( this, type, listener, useCapture );
  };

})( this, document, Element );
