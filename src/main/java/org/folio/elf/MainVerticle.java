package org.folio.elf;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;
import java.io.IOException;
import java.lang.management.ManagementFactory;

/**
 * A verticle acting as a light-weight static server.
 */
public class MainVerticle extends AbstractVerticle {

    private final Logger logger = LoggerFactory.getLogger("folio-elf");
    
    @Override
    public void start(Future<Void> fut) throws IOException {
        final int port = Integer.parseInt(System.getProperty("port", "8080"));
        logger.info("Starting Elf " + ManagementFactory.getRuntimeMXBean().getName() + " on port " + port);
        Router router = createRouter(vertx);
        vertx.createHttpServer().requestHandler(router::accept).listen(port, result -> {
            if (result.succeeded()) {
                logger.debug("Elf: Succeeded in starting the listener");
                fut.complete();
            } else {
                logger.error("Elf failed to start the listener: " + result.cause());
                fut.fail(result.cause());
            }
        });
    }

    private Router createRouter(Vertx v) {
        Router router = Router.router(v);
        router.route("/static/*").handler(StaticHandler.create("static"));
        return router;
    }
}
