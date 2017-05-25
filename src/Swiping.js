(function ($, window) {
    function Swiping(options) {

        var defaults = {
            screen: null, // JQuery object (requried)
            selectors: {
                bar: null, // selector (optional)
                item: null // selector (optional)
            },
            step: 100,
            swipeAction: 'autoStep',
            onSwipe: null,
            screenWidth: null
        };

        var config = $.extend(defaults, options);

        // видимая часть слайдера
        var screen = config.screen;

        // полоса слайдера
        var bar = config.selectors.bar
            ? screen.find(config.selectors.bar)
            : screen.children().first();

        var items = config.selectors.item
            ? bar.find(config.selectors.item)
            : bar.children();

        // флаги состояния: крайнне левое или правое положение
        var atLeft = true;
        var atRight = false;
        var currentShift = 0; // только для screen

        // текущая позиция: значение свойства left для полосы слайдера
        var currentLeftPosition = 0;

        // ширина видимой части слайдера
        var screenWidth = config.screenWidth || screen.width();

        // крайнее правое положение: значение свойства left для полосы слайдера
        var rightShiftLimit = (bar.width() - screenWidth) * -1;
        var rightShiftLimitInPercent = ((bar.width() * 100 / screenWidth) - 100) * -1; // только для screen

        // координаты видимой части полосы (левый и правый угол по оси x)
        var barLeft = 0;
        var barRight = barLeft + screenWidth;

        // при ресайзе перещитываем некоторые значения
        var resizeTimer;
        $(window).on('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                screenWidth = screen.width();
                rightShiftLimit = (bar.width() - screenWidth) * -1;
                rightShiftLimitInPercent = ((bar.width() * 100 / screenWidth) - 100) * -1; // только для screen
                barRight = barLeft + screenWidth;
            }, 250);

        });

        /**
         * Движение вправо
         */
        var goNext = function () {
            // если уже справа больше ничего не делаем
            if (atRight) {
                return;
            }

            currentShift++;

            var left = 0;

            items.each(function (index, item) {
                var $item = $(item);
                var itemLeft = $item.position().left;
                var itemWidth = $item.outerWidth();
                var itemRight = itemLeft + itemWidth;

                if (itemRight > barRight) {
                    left = -itemLeft;
                    return false;
                }
            });

            if (left <= rightShiftLimit) {
                left = rightShiftLimit;
                atRight = true;
            }
            atLeft = false;

            moveBarTo(left);
        };

        /**
         * Движение влево
         */
        var goPrev = function () {
            // если уже слева больше ничего не делаем
            if (atLeft) {
                return;
            }

            currentShift--;

            var left = 0;

            $(items.toArray().reverse()).each(function (index, item) {
                var $item = $(item);
                var itemLeft = $item.position().left;

                if (itemLeft < barLeft) {
                    var itemWidth = $item.outerWidth();
                    var itemRight = itemLeft + itemWidth;
                    left = -(itemRight - screenWidth);
                    return false;
                }
            });

            if (left >= 0) {
                left = 0;
                atLeft = true;
            }
            atRight = false;
            moveBarTo(left);
        };

        /**
         * Движение вправо на шаг
         */
        var goNextStep = function (step, stepCount) {
            // если уже справа больше ничего не делаем
            if (atRight) {
                return;
            }

            currentShift++;

            step = step || config.step;
            stepCount = stepCount || 1;

            var left = (currentLeftPosition - step * stepCount);

            if (left <= rightShiftLimit) {
                left = rightShiftLimit;
                atRight = true;
            }
            atLeft = false;
            moveBarTo(left);
        };

        /**
         * Движение влево на шаг
         */
        var goPrevStep = function (step, stepCount) {
            // если уже слева больше ничего не делаем
            if (atLeft) {
                return;
            }

            currentShift--;

            step = step || config.step;
            stepCount = stepCount || 1;

            var left = (currentLeftPosition + step * stepCount);
            if (left >= 0) {
                left = 0;
                atLeft = true;
            }
            atRight = false;
            moveBarTo(left);
        };

        /**
         * Движение вправо на экран
         */
        var goNextScreen = function (step) {
            // если уже справа больше ничего не делаем
            if (atRight) {
                return;
            }

            step = step || config.step;

            currentShift++;
            var left = (step * currentShift * -1);
            if (left <= rightShiftLimitInPercent) {
                left = rightShiftLimitInPercent;
                atRight = true;
            }
            atLeft = false;
            bar.css('left', left + '%');
        };

        /**
         * Движение влево на экран
         */
        var goPrevScreen = function (step) {
            // если уже слева больше ничего не делаем
            if (atLeft) {
                return;
            }

            step = step || config.step;

            currentShift--;
            var left = (step * currentShift * -1);
            if (left >= 0) {
                left = 0;
                atLeft = true;
            }
            atRight = false;
            bar.css('left', left + '%');
        };

        /**
         * Движение на позицию
         * @param {number} left позиция (левая координата)
         */
        var goTo = function (left, cs) {
            currentShift = typeof cs !== undefined
                ? cs
                : currentShift;

            if (left <= rightShiftLimit) {
                left = rightShiftLimit;
                atRight = true;
                atLeft = false;
            }
            if (left >= 0) {
                left = 0;
                atLeft = true;
                atRight = false;
            }
            moveBarTo(left);
        };

        /**
         * Движение к элементу с индексом
         * @param index
         */
        var goToItem = function (index) {
            currentShift = index;

            // соответствующий ему индикатор
            var indicator = $(items[index]);

            // координаты левого и правого угла текущего индикатора относительно полосы (по оси x)
            var indicatorLeft = indicator.position().left;
            var indicatorRight = indicatorLeft + indicator.outerWidth();

            // если текущий индикатор за пределами видимой части полосы =>
            // прокручиваем
            if (indicatorRight > barRight) {
                goTo(-indicatorLeft);
            }
            else if (indicatorLeft < barLeft) {
                goTo(-(indicatorRight - screenWidth));
            }
        };

        /**
         * Двигает полосу на позицию
         * @param {number} left координаты левого угла
         */
        function moveBarTo(left) {
            currentLeftPosition = left;
            bar.css('left', left + 'px');

            // координаты видимой части полосы (левый и правый угол по оси x)
            barLeft = -(left);
            barRight = barLeft + screenWidth;

            if (config.onSwipe && typeof config.onSwipe === 'function')
            {
                config.onSwipe({
                    left: left,
                    atLeft: atLeft,
                    atRight: atRight,
                    currentShift: currentShift,
                    screenWidth: screenWidth,
                    rightShiftLimit: rightShiftLimit,
                    rightShiftLimitInPercent:rightShiftLimitInPercent,
                    barLeft: barLeft,
                    barRight: barRight
                });
            }
        }

        // swipe событие для слайдера (пролистывание полосы слайдера)
        switch (config.swipeAction) {
            case 'autoStep':
                screen
                    .on('swipeleft', function(){
                        goNext();
                    })
                    .on('swiperight', function(){
                        goPrev();
                    });

                this.next = goNext;
                this.prev = goPrev;
                this.to = goTo;
                this.toItem = goToItem;

                break;
            case 'step':
                screen
                    .on('swipeleft', function(){
                        goNextStep();
                    })
                    .on('swiperight', function(){
                        goPrevStep();
                    });

                this.next = goNextStep;
                this.prev = goPrevStep;
                this.to = goTo;
                this.toItem = goToItem;

                break;
            case 'screen':
                screen
                    .on('swipeleft', function(){
                        goNextScreen();
                    })
                    .on('swiperight', function(){
                        goPrevScreen();
                    });

                this.next = goNextScreen;
                this.prev = goPrevScreen;

                break;
            default:
                console.error('Swipe action ' + config.swipeAction + ' does not support');
        }

        screen.on('dragstart', function () {
            return false;
        });
        screen.on('drop', function () {
            return false;
        });
    }

    window.Swiping = Swiping;

    $.fn.Swiping = function(options) {
        options = options || {};
        options.screen = this;

        return new Swiping(options);
    }
})(jQuery, window);