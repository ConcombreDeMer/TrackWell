#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WatchSyncModule, RCTEventEmitter)

RCT_EXTERN_METHOD(publishSession:(NSDictionary *)payload)
RCT_EXTERN_METHOD(sendCommand:(NSDictionary *)payload)

@end
