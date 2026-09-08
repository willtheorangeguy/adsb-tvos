#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import <UIKit/UIKit.h>

// Planespotters requires direct downloads without storing image binaries.
// An ephemeral session and a dedicated UIImageView avoid disk/RN image caches.
@interface AircraftPhotoView : UIView
@property(nonatomic, copy) NSString *src;
@property(nonatomic, copy) RCTDirectEventBlock onLoadError;
@property(nonatomic, strong) UIImageView *imageView;
@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSURLSessionDataTask *task;
@end

@implementation AircraftPhotoView
- (instancetype)init {
  if ((self = [super init])) {
    _imageView = [UIImageView new];
    _imageView.contentMode = UIViewContentModeScaleAspectFit;
    [self addSubview:_imageView];
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration ephemeralSessionConfiguration];
    config.URLCache = nil;
    config.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
    config.timeoutIntervalForRequest = 10;
    _session = [NSURLSession sessionWithConfiguration:config];
  }
  return self;
}
- (void)layoutSubviews { [super layoutSubviews]; self.imageView.frame = self.bounds; }
- (void)setSrc:(NSString *)src {
  if ([_src isEqualToString:src]) return;
  _src = [src copy];
  [self.task cancel];
  self.imageView.image = nil;
  NSURL *url = [NSURL URLWithString:src];
  if (![url.scheme isEqualToString:@"https"] || ![@[@"t.plnspttrs.net", @"cdn.planespotters.net"] containsObject:url.host]) return;
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  [request setValue:@"ADSB-TV/0.1 (+https://github.com/willtheorangeguy/adsb-tvos)" forHTTPHeaderField:@"User-Agent"];
  __weak AircraftPhotoView *weakSelf = self;
  self.task = [self.session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (error.code == NSURLErrorCancelled) return;
    UIImage *image = !error && [(NSHTTPURLResponse *)response statusCode] == 200 ? [UIImage imageWithData:data] : nil;
    dispatch_async(dispatch_get_main_queue(), ^{
      AircraftPhotoView *view = weakSelf;
      if (!view || ![view.src isEqualToString:src]) return;
      view.imageView.image = image;
      if (!image && view.onLoadError) view.onLoadError(@{});
    });
  }];
  [self.task resume];
}
- (void)dealloc { [_task cancel]; [_session invalidateAndCancel]; }
@end

@interface AircraftPhotoManager : RCTViewManager
@end
@implementation AircraftPhotoManager
RCT_EXPORT_MODULE(AircraftPhoto)
RCT_EXPORT_VIEW_PROPERTY(src, NSString)
RCT_EXPORT_VIEW_PROPERTY(onLoadError, RCTDirectEventBlock)
- (UIView *)view { return [AircraftPhotoView new]; }
+ (BOOL)requiresMainQueueSetup { return YES; }
@end
