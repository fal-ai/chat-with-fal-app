import GitHubIcon from "@/components/GitHubIcon";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";

export default function NavBar() {
  return (
    <div className="navbar bg-base-100 shadow-sm fixed top-0 z-50">
      <div className="container mx-auto">
        <div className="flex-1 max-md:flex-col">
          <a
            className="text-md md:text-lg normal-case tracking-wide ps-2 md:ps-0"
            href="#"
          >
            <span className="whitespace-nowrap dark:text-white font-light">
              <ChatBubbleBottomCenterTextIcon className="stroke-secondary inline-block w-6 h-6" />
              <span className="font-light">with</span>
              <span className="text-secondary font-normal">fal</span>
            </span>
          </a>
          <span className="text-xs dark:text-white font-light md:ms-1 max-md:ps-2 max-md:block max-md:max-w-fit">
            <span className="opacity-70">powered by </span>
            <a
              className="link font-medium opacity-70 hover:opacity-100"
              href="https://docs.fal.ai/fal-serverless/quickstart"
            >
              fal-serverless
            </a>
          </span>
        </div>
        <div className="flex">
          <a
            href="https://github.com/fal-ai/chat-with-fal-app"
            target="_blank"
            className="opacity-40 hover:opacity-70 dark:opacity-60 dark:hover:opacity-90 transition-opacity duration-200 pe-2 md:pe-0"
          >
            <GitHubIcon />
          </a>
          {/* <a>
            <InformationCircleIcon className="fill-current" />
          </a> */}
        </div>
      </div>
    </div>
  );
}
