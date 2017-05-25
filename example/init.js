+function ($) {
	$(function () {
		var screenWidth = 1920;

		// перебираем все презентации
		$('.presentation').each(function () {

			var screen = $(this);
			var bar = $(this).find('.bar');
			var sliders = screen.find('.slide');

			var length = sliders.length;

			var swiping;

			// если больше одного слайда
			if (length > 1) {
				// прописываем ширину бара - необходимо для swiping (можно вручную в html указать)
				bar.css('width', length * screenWidth + 'px');

				// вставляем кружки индикаторы по количеству слайдов
				var indicatorBar =
					$('<ul class="indicators">'
						+ Array(length + 1).join('<li class="indicator"></li>')
						+ '</ul>');

				// кнопки вперед/назад
				var prevButton = $('<button type="button" class="prev"></button>');
				var nextButton = $('<button type="button" class="next"></button>');

				bar
					.after(indicatorBar)
					.after(prevButton)
					.after(nextButton);

				prevButton.hide();

				var indicators = screen.find('.indicator');
				indicators.eq(0).addClass('active');

				// слайдер
				swiping = screen.Swiping({
					screenWidth: screenWidth,
					onSwipe: function (state) {
						indicators.removeClass('active');
						indicators.eq(state.currentShift).addClass('active');

						if (state.atLeft) {
							prevButton.hide();
						}
						else {
							prevButton.show();
						}

						if (state.atRight) {
							nextButton.hide();
						}
						else {
							nextButton.show();
						}

						setTimeout(function () {
							sliders.removeClass('active');
							sliders.eq(state.currentShift).addClass('active');
						}, 700);
					}
				});

				// кнопки вперед/назад
				prevButton.on('click', function () {
					swiping.prev();
				});

				nextButton.on('click', function () {
					swiping.next();
				});
			}

			// кнопка возврата на главный экран
			screen.find('.slide [data-back]').on('click', function () {
				back();
			});

			// возврат на главный экран при бездействии
			var interval = 120000;

			var timer = setTimeout(function () {
				back();
			}, interval);

			$(document).on('click swipe', function () {
				clearTimeout(timer);
				timer = setTimeout(function () {
					back();
				}, interval);
			});

			function back() {
				if(swiping) {
					bar.css('transition', 'none');
					swiping.to(0, 0);

					setTimeout(function () {
						bar.css('transition', '');
						sliders.removeClass('active');
					}, 710);
				}
				screen.removeClass('screen');
			}
		});

		// клик на data-href (навигация на главном экране)
		$('[data-href]').on('click', function () {

			var targetId = $(this).data('href');
			var target = $('#' + targetId);

			target.addClass('screen');

			var sliders = target.find('.slide');

			setTimeout(function () {
				sliders.eq(0).addClass('active');
			}, 510);
		});
	});
}(jQuery);