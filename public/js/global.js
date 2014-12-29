// Simple card buttons
$('.card').click(function(e) {

  // Modal function
  if($(e.target).is('.open-modal')) {
    var data = $(e.target).attr('data');
    $(data).show();
  }

  if($(this).hasClass('on')) {
    $(this).find('.on-append').remove();
    $(this).find('.upcoming-event').show();
    $(this).removeClass('on');
  } else {
    $(this).append('<div class=\'on-append\'>' +
    '<a href=\'\'><i class=\'oi\' data-glyph=\'person\'></i></a>' +
    // '<span class=\'open-modal\' data=\'.contact-modal\'><i class=\'oi\' data-glyph=\'phone\'></i></span>' +
    '<a href=\'\'><i class=\'oi\' data-glyph=\'calendar\'></i></a>' +
    '<span class=\'open-modal\' data=\'.delete-modal\'><i class=\'oi\' data-glyph=\'x\'></i></span>' +
    '</div>');
    $(this).find('.upcoming-event').hide();
    $(this).addClass('on');
  }
});
