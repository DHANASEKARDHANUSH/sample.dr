from queue import PriorityQueue

class state(object):
    def __init__(self,value,parent,start=0,goal=0):
        self.children = []
        self.value = value
        self.parent = parent
        self.dist=0
        if parent:
            self.start=parent.start
            self.goal=parent.goal
            self.path=parent.path[:]
            self.path.append(value)
        else:
            self.start=start
            self.goal=goal
            self.path=[value]
    def getdist(self):
        pass
    def createchildren(self):
        pass
class state_string(state):
    def __init__(self, value, parent, start=0, goal=0):
        super(state_string,self).__init__(value, parent, start, goal)
        self.dist=self.getdist()
    def getdist(self):
        if self.value==self.goal:
            return 0
        dist=0
        for i in range(len(self.goal)):
            letter=self.goal[i]
            dist+=abs(i - self.value.index(letter))
        return dist
    def createchildren(self):
        if not self.children:
            for i in range(len(self.goal)-1):
                val=list(self.value)
                val[i],val[i+1]=val[i+1],val[i]
                # keep child values as strings for consistent comparisons
                child_value = ''.join(val)
                child=state_string(child_value,self)
                self.children.append(child) 
class astar:
    def __init__(self,start,goal):
        self.path=[]
        self.visitedqueue=[]
        self.priorityqueue=PriorityQueue()
        self.start=start
        self.goal=goal
    def solve(self):
        startstate=state_string(self.start,None,self.start,self.goal)
        count=0
        # push as (priority, tie-breaker, state)
        self.priorityqueue.put((startstate.dist, count, startstate))
        while not self.path and self.priorityqueue.qsize():
            closestchild=self.priorityqueue.get()[2]
            closestchild.createchildren()
            self.visitedqueue.append(closestchild.value)
            for child in closestchild.children:
                # skip already visited states
                if child.value in self.visitedqueue:
                    continue
                count+=1
                if not child.dist:
                    self.path=child.path
                    break
                self.priorityqueue.put((child.dist,count,child))
        if not self.path:
            return None
if __name__=="__main__":
    start1="TYRE"
    goal1="FIRE"
    a = astar(start1,goal1)
    a.solve()
    for i in range(len(a.path)-1):
        print(a.path[i],"->",a.path[i+1])