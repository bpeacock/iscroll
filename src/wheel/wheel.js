
    _initWheel: function () {
        var that = this;

        utils.addEvent(this.wrapper, 'wheel', this);
        utils.addEvent(this.wrapper, 'mousewheel', this);
        utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

        this.on('destroy', function () {
            utils.removeEvent(this.wrapper, 'wheel', this);
            utils.removeEvent(this.wrapper, 'mousewheel', this);
            utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
        });

        this._wheelData = {
            lineHeight: parseInt(this.wrapper.parentNode.style.fontSize, 10),
            shouldAdjustOldDeltas: function(orgEvent, absDelta) {
                // If this is an older event and the delta is divisable by 120,
                // then we are assuming that the browser is treating this as an
                // older mouse wheel event and that we should divide the deltas
                // by 40 to try and get a more usable deltaFactor.
                // Side note, this actually impacts the reported scroll distance
                // in older browsers and can cause scrolling to be slower than native.
                return orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
            },
            end: function() {
                that.resetPosition(that.options.bounceTime);
            }
        };
    },

    _wheel: function (e) {
        if ( !this.enabled ) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        var newX, newY,
            that = this;

        if ( this.wheelTimeout === undefined ) {
            that._execEvent('scrollStart');
        }

        // Execute the scrollEnd event after 400ms the wheel stopped scrolling
        clearTimeout(this.wheelTimeout);
        this.wheelTimeout = setTimeout(function () {
            that._execEvent('scrollEnd');
            that.wheelTimeout = undefined;
        }, 400);

        /*** Get the wheelDelta's ***/
        // Adopted from jquery-mousewheel (https://github.com/brandonaaron/jquery-mousewheel)
        var wheelDeltaX     = 0,
            wheelDeltaY     = 0;

        // Old school scrollwheel delta
        if ( 'detail'      in e ) { wheelDeltaY = e.detail * -1;      }
        if ( 'wheelDelta'  in e ) { wheelDeltaY = e.wheelDelta;       }
        if ( 'wheelDeltaY' in e ) { wheelDeltaY = e.wheelDeltaY;      }
        if ( 'wheelDeltaX' in e ) { wheelDeltaX = e.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in e && e.axis === e.HORIZONTAL_AXIS ) {
            wheelDeltaX = wheelDeltaY * -1;
            wheelDeltaY = 0;
        }

        // New school wheel delta (wheel event)
        if ( 'deltaY' in e ) {
            wheelDeltaY = e.deltaY * -1 * this.options.invertWheelDirection;
        }

        if ( 'deltaX' in e ) {
            wheelDeltaX = e.deltaX * -1 * this.options.invertWheelDirection;
        }

        // No change actually happened, no reason to go any further
        if ( wheelDeltaY === 0 && wheelDeltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( e.deltaMode === 1 ) {
            var lineHeight = this._wheelData.lineHeight;
            wheelDeltaY *= lineHeight;
            wheelDeltaX *= lineHeight;
        } else if ( e.deltaMode === 2 ) {
            var pageHeight = this.wrapperHeight;
            wheelDeltaY *= pageHeight;
            wheelDeltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(wheelDeltaY), Math.abs(wheelDeltaX) );

        // Adjust older deltas if necessary
        if ( this._wheelData.shouldAdjustOldDeltas(e, absDelta) ) {
            // Divide all the things by 40!
            wheelDeltaX /= 40;
            wheelDeltaY /= 40;
        }

        /*** Make vertical mouse wheel work for horizontal scrolling in certain cases ***/
        //Not sure on the naming of this.options.horizontalMouseWheel
        if ( !this.hasVerticalScroll && !wheelDeltaX && this.options.horizontalMouseWheel) {
            wheelDeltaX = wheelDeltaY;
            wheelDeltaY = 0;
        }

        /*** Find the New Position of the iScroll ***/
        if ( this.options.snap ) {
            newX = this.currentPage.pageX;
            newY = this.currentPage.pageY;

            if ( wheelDeltaX > 0 ) {
                newX--;
            } else if ( wheelDeltaX < 0 ) {
                newX++;
            }

            if ( wheelDeltaY > 0 ) {
                newY--;
            } else if ( wheelDeltaY < 0 ) {
                newY++;
            }

            this.goToPage(newX, newY);

            return;
        }
        else {
            this._translateFromDeltas(wheelDeltaX, wheelDeltaY);
        }

        /*** Scroll End Event ***/
        clearTimeout(this._wheelData.endTimer);
        this._wheelData.endTimer = setTimeout(this._wheelData.end, 40);


// INSERT POINT: _wheel
    },
