import {Navigate, createHashRouter} from "react-router-dom";
import DefaultLayout from "../views/DefaultLayout";
import Monitoring from "../Pages/Monitoring";
import Dispatching from "../Pages/Dispatching";
import Pending from "../Pages/Pending";
import NotFound from "../Pages/Notfound";
import IteneraryEdit from "../Pages/IteneraryEdit";
import ViewItinerary from "../Pages/ViewItinerary";


const Router = createHashRouter([
    {
        path: "/",
        element: <DefaultLayout/>,
        children: [
            {
                path: '/',
                element: <Navigate to="/monitoring" />
            },
            {
                path: '/monitoring',
                element: <Monitoring />
            },

            {
                path: '/dispatching',
                element: <Dispatching />
            },

            {
                path: '/dispatching/:id',
                element: <IteneraryEdit />
            },

            {
                path: '/pending',
                element: <Pending />
            },

            {
                path: '/viewitinerary',
                element: <ViewItinerary/>
            }
        ],
    },
    {
        path: '*',
        element: <NotFound />
    }
]);



export default Router;